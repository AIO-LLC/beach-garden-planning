use crate::api::auth;
use crate::api::wrappers;
use axum::http::HeaderMap;
use axum::http::HeaderValue;
use axum::http::header::AUTHORIZATION;
use axum::http::header::CONTENT_TYPE;
use axum::{
    Json,
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::patch,
};
use axum::{
    Router,
    routing::{get, post},
};
use deadpool_postgres;
use deadpool_postgres::{ManagerConfig, Pool, RecyclingMethod, Runtime};
use dotenvy::dotenv;
use std::env;
use thiserror::Error;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
pub struct AppState {
    pub pool: Pool,
}

pub async fn build_state() -> AppState {
    dotenv().ok();

    let postgres_user: String =
        env::var("POSTGRES_USER").expect("Undefined POSTGRES_USER environment variable");
    let postgres_db: String =
        env::var("POSTGRES_DB").expect("Undefined POSTGRES_DB environment variable");
    let postgres_password: String =
        env::var("POSTGRES_PASSWORD").expect("Undefined POSTGRES_PASSWORD environment variable");
    let postgres_host: String =
        env::var("POSTGRES_HOST").expect("Undefined POSTGRES_HOST environment variable");
    let postgres_port: u16 = str::parse(
        &env::var("POSTGRES_PORT").expect("Undefined POSTGRES_PORT environment variable"),
    )
    .unwrap();

    let mut cfg = deadpool_postgres::Config::new();
    cfg.host = Some(postgres_host.clone());
    cfg.user = Some(postgres_user);
    cfg.dbname = Some(postgres_db);
    cfg.password = Some(postgres_password);
    cfg.port = Some(postgres_port);
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });

    #[cfg(feature = "local")]
    {
        // For local development, use NoTls or disable SSL
        cfg.ssl_mode = Some(deadpool_postgres::SslMode::Disable);
        let pool = cfg
            .create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)
            .unwrap();
        AppState { pool }
    }

    #[cfg(not(feature = "local"))]
    {
        // For production with Supabase
        if postgres_host.contains("supabase") {
            tracing::info!("Connecting to Supabase database...");

            // For Supabase, we need to accept their certificate
            cfg.ssl_mode = Some(deadpool_postgres::SslMode::Require);

            // Create a TLS connector that accepts Supabase's certificate
            let connector = native_tls::TlsConnector::builder()
                .danger_accept_invalid_certs(true) // Required for Supabase
                .build()
                .expect("Failed to create TLS connector");

            let connector = postgres_native_tls::MakeTlsConnector::new(connector);

            let pool = cfg
                .create_pool(Some(Runtime::Tokio1), connector)
                .expect("Failed to create pool with Supabase");

            tracing::info!("Successfully connected to Supabase database");
            AppState { pool }
        } else {
            // For other providers or if you want to disable SSL
            tracing::info!("Connecting to non-Supabase database...");
            cfg.ssl_mode = Some(deadpool_postgres::SslMode::Prefer);

            // Use native TLS with relaxed certificate validation
            let connector = native_tls::TlsConnector::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .expect("Failed to create TLS connector");

            let connector = postgres_native_tls::MakeTlsConnector::new(connector);

            let pool = cfg
                .create_pool(Some(Runtime::Tokio1), connector)
                .expect("Failed to create pool");

            AppState { pool }
        }
    }
}

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("database error")]
    Db(#[from] tokio_postgres::Error),
    #[error("pool error")]
    Pool(#[from] deadpool_postgres::PoolError),
    #[error("not found")]
    NotFound,
    #[error("unauthorized")]
    WrongCredentials,
    #[error("unprocessable entity")]
    NewPasswordMustBeDifferent,
    #[error("gone")]
    TokenExpired,
    #[error("bad request")]
    MissingAuthToken,
    #[error("unauthorized")]
    InvalidAuthToken,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Resource not found".to_string()),
            ApiError::Db(db_err) => {
                tracing::error!("Database error: {}", db_err);
                match db_err.as_db_error() {
                    Some(db_error) => {
                        // Handle specific PostgreSQL errors
                        match db_error.code().code() {
                            "23505" => (StatusCode::CONFLICT, "Duplicate entry".to_string()),
                            "23503" => (
                                StatusCode::BAD_REQUEST,
                                "Foreign key constraint violation".to_string(),
                            ),
                            _ => (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                format!("Database error: {db_err}"),
                            ),
                        }
                    }
                    None => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Database error: {db_err}"),
                    ),
                }
            }
            ApiError::Pool(pool_err) => {
                tracing::error!("Connection pool error: {}", pool_err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Connection pool error: {pool_err}"),
                )
            }
            ApiError::WrongCredentials => {
                (StatusCode::UNAUTHORIZED, "Wrong credentials".to_string())
            }
            ApiError::NewPasswordMustBeDifferent => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "New password must be different from the current password".to_string(),
            ),
            ApiError::TokenExpired => (StatusCode::GONE, "Token expired".to_string()),
            ApiError::MissingAuthToken => (
                StatusCode::BAD_REQUEST,
                "Authentication token required".to_string(),
            ),
            ApiError::InvalidAuthToken => (
                StatusCode::UNAUTHORIZED,
                "Invalid authentication token".to_string(),
            ),
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

pub async fn router(app_state: AppState) -> Router {
    dotenv().ok();

    let mut router = Router::new()
        // Member routes
        .route(
            "/member",
            post(wrappers::member::add_member).patch(wrappers::member::update_member),
        )
        .route(
            "/member-with-password",
            patch(wrappers::member::update_member_with_password),
        )
        .route("/members", get(wrappers::member::get_all_members))
        .route(
            "/member/{id}",
            get(wrappers::member::get_member).delete(wrappers::member::delete_member),
        )
        .route("/password", patch(wrappers::member::update_password))
        .route("/password-reset", patch(wrappers::member::password_reset))
        // Reservation routes
        .route(
            "/reservation",
            patch(wrappers::reservation::update_reservation)
                .post(wrappers::reservation::add_reservation),
        )
        .route(
            "/reservations/{date}",
            get(wrappers::reservation::get_reservations_with_names_by_date),
        )
        .route(
            "/reservation/{id}",
            get(wrappers::reservation::get_reservation)
                .delete(wrappers::reservation::delete_reservation),
        )
        // Authentication routes
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/verify-token", get(auth::verify_token))
        .route("/refresh-jwt", post(auth::refresh_jwt))
        .route("/password-forgotten", post(auth::password_forgotten))
        .route(
            "/test-auth",
            get(|headers: HeaderMap| async move {
                match auth::extract_token_from_headers(&headers) {
                    Ok(_token) => (StatusCode::OK, "Token found".to_string()),
                    Err(_) => (StatusCode::UNAUTHORIZED, "No token".to_string()),
                }
            }),
        )
        .with_state(app_state)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &axum::http::Request<_>| {
                    let matched_path = request
                        .extensions()
                        .get::<axum::extract::MatchedPath>()
                        .map(axum::extract::MatchedPath::as_str);

                    tracing::info_span!(
                        "http_request",
                        method = ?request.method(),
                        matched_path,
                        some_other_field = tracing::field::Empty,
                    )
                })
                .on_request(|request: &axum::http::Request<_>, _span: &tracing::Span| {
                    tracing::debug!(
                        "Started processing request: {} {}",
                        request.method(),
                        request.uri()
                    );
                })
                .on_response(
                    |response: &axum::http::Response<_>,
                     latency: std::time::Duration,
                     _span: &tracing::Span| {
                        tracing::debug!(
                            "Response generated in {:?} - Status: {}",
                            latency,
                            response.status()
                        );
                    },
                )
                .on_failure(
                    |error: tower_http::classify::ServerErrorsFailureClass,
                     latency: std::time::Duration,
                     _span: &tracing::Span| {
                        tracing::error!("Request failed after {:?} - Error: {:?}", latency, error);
                    },
                ),
        );

    #[cfg(feature = "local")]
    {
        let frontend_ip: &str =
            &env::var("FRONTEND_IP").expect("Undefined FRONTEND_IP environment variable");
        let frontend_port: u16 = str::parse(
            &env::var("FRONTEND_PORT").expect("Undefined FRONTEND_PORT environment variable"),
        )
        .unwrap();

        let cors = CorsLayer::new()
            .allow_origin(
                HeaderValue::from_str(&format!("http://{frontend_ip}:{frontend_port}"))
                    .expect("Invalid origin header"),
            )
            .allow_methods(vec![
                Method::GET,
                Method::POST,
                Method::PATCH,
                Method::DELETE,
            ])
            .allow_headers([AUTHORIZATION, CONTENT_TYPE])
            .expose_headers([CONTENT_TYPE])
            .allow_credentials(true);

        router = router.layer(cors)
    }

    router
}

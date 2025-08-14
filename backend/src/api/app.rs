use crate::api::auth;
use crate::api::wrappers;
use axum::http::header::CONTENT_TYPE;
use axum::{
    Json,
    http::{HeaderValue, Method, StatusCode},
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
use tokio_postgres::NoTls;
use tower_http::cors::CorsLayer;

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
    let postgres_port: u16 = str::parse(
        &env::var("POSTGRES_PORT").expect("Undefined POSTGRES_PORT environment variable"),
    )
    .unwrap();

    let mut cfg = deadpool_postgres::Config::new();
    cfg.host = Some("localhost".into());
    cfg.user = Some(postgres_user);
    cfg.dbname = Some(postgres_db);
    cfg.password = Some(postgres_password);
    cfg.port = Some(postgres_port);
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });

    let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls).unwrap();
    AppState { pool }
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
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

pub async fn router(app_state: AppState) -> Router {
    dotenv().ok();
    let api_ip: &str = &env::var("API_IP").unwrap_or("0.0.0.0".to_string());
    let cors = CorsLayer::new()
        .allow_origin(
            HeaderValue::from_str(&format!("http://{api_ip}:3000")).expect("Invalid origin header"),
        )
        .allow_methods(vec![
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([CONTENT_TYPE])
        .allow_credentials(true);

    Router::new()
        // Member routes
        .route(
            "/member",
            post(wrappers::member::add_member).patch(wrappers::member::update_member),
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
        // Authentication
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/jwt-claims", get(auth::get_jwt_claims))
        .route("/password-forgotten", post(auth::password_forgotten))
        .with_state(app_state)
        .layer(cors)
}

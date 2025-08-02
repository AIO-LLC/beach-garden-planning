use crate::api::wrappers;
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
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
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, msg) = match &self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            ApiError::Db(_) | ApiError::Pool(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error".into())
            }
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

pub async fn router(app_state: AppState) -> Router {
    Router::new()
        .route(
            "/member",
            post(wrappers::members::add_member)
            .patch(wrappers::members::update_member)
        )
        .route("/members", get(wrappers::members::get_all_members))
        .route(
            "/member/{id}",
            get(wrappers::members::get_member)
            .delete(wrappers::members::delete_member),
        )
        .route("/address", post(wrappers::addresses::add_address))
        .route(
            "/address/{member_id}",
            get(wrappers::addresses::get_address_by_member_id)
            .patch(wrappers::addresses::update_address_by_member_id)
            .delete(wrappers::addresses::delete_address_by_member_id),
        )
        .with_state(app_state)
}

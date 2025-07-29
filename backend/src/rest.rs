use crate::db::{models, queries};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use chrono::{NaiveDate, NaiveTime};
use deadpool_postgres::{ManagerConfig, Pool, RecyclingMethod, Runtime};
use dotenvy::dotenv;
use serde::Deserialize;
use std::env;
use thiserror::Error;
use tokio_postgres::NoTls;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("database error")]
    Db(#[from] tokio_postgres::Error),
    #[error("pool error")]
    Pool(#[from] deadpool_postgres::PoolError),
    #[error("event not found")]
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
    let postgres_port: String =
        env::var("POSTGRES_PORT").expect("Undefined POSTGRES_PORT environment variable");

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

#[derive(Deserialize)]
pub struct Event {
    name: String,
    date: NaiveDate,
    time: NaiveTime,
}

pub async fn insert_into_events(
    State(state): State<AppState>,
    Json(payload): Json<Event>,
) -> Result<Json<i32>, ApiError> {
    let client = state.pool.get().await?;
    let id =
        queries::insert_into_events(&client, &payload.name, payload.date, payload.time).await?;
    Ok(Json(id))
}

pub async fn get_day_events(
    State(state): State<AppState>,
    Path(date): Path<NaiveDate>,
) -> Result<Json<Vec<models::Event>>, ApiError> {
    let client = state.pool.get().await?;
    let events = queries::get_day_events(&client, date).await?;
    Ok(Json(events))
}

pub async fn delete_event(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = queries::delete_event(&client, id).await?;
    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

use crate::api::app::{ApiError, AppState};
use crate::db::{models, queries};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use chrono::{NaiveDate, NaiveTime};
use serde::Deserialize;

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
    Path(data): Path<NaiveDate>,
) -> Result<Json<Vec<models::Event>>, ApiError> {
    let client = state.pool.get().await?;
    let events = queries::get_day_events(&client, data).await?;
    Ok(Json(events))
}

pub async fn delete_event(
    State(state): State<AppState>,
    Path(data): Path<i32>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = queries::delete_event(&client, data).await?;
    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

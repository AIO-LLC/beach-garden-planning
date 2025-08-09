use crate::api::app::{ApiError, AppState};
use crate::db::models;
use crate::db::queries::reservation;
use crate::utils::gen_id;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use chrono::NaiveDate;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ReservationPayload {
    pub id: String,
    pub member_id: String,
    pub court_number: i16,
    pub reservation_date: NaiveDate,
    pub reservation_time: i16,
}

pub async fn add_reservation(
    State(state): State<AppState>,
    Json(payload): Json<ReservationPayload>,
) -> Result<Json<String>, ApiError> {
    let id: String = match payload.id {
        ref id if id.is_empty() => gen_id().expect("Could not generate an ID."),
        id => id,
    };

    let client = state.pool.get().await?;
    let id_from_db: String = reservation::add_reservation(
        &client,
        &models::Reservation {
            id,
            member_id: payload.member_id,
            court_number: payload.court_number,
            reservation_date: payload.reservation_date,
            reservation_time: payload.reservation_time,
        },
    )
    .await?;

    Ok(Json(id_from_db))
}

pub async fn get_reservation(
    State(state): State<AppState>,
    Path(reservation_id): Path<String>,
) -> Result<Json<models::Reservation>, ApiError> {
    let client = state.pool.get().await?;
    match reservation::get_reservation(&client, &reservation_id).await {
        Ok(reservation) => Ok(Json(reservation)),
        Err(_) => Err(ApiError::NotFound),
    }
}

pub async fn get_reservations_with_names_by_date(
    State(state): State<AppState>,
    Path(date): Path<NaiveDate>,
) -> Result<Json<Vec<models::ReservationWithNames>>, ApiError> {
    let client = state.pool.get().await?;
    let reservations = reservation::get_reservations_with_names_by_date(&client, &date).await?;
    Ok(Json(reservations))
}

pub async fn update_reservation(
    State(state): State<AppState>,
    Json(payload): Json<ReservationPayload>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = reservation::update_reservation(
        &client,
        &models::Reservation {
            id: payload.id,
            member_id: payload.member_id,
            court_number: payload.court_number,
            reservation_date: payload.reservation_date,
            reservation_time: payload.reservation_time,
        },
    )
    .await?;

    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

pub async fn delete_reservation(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = reservation::delete_reservation(&client, &id).await?;
    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

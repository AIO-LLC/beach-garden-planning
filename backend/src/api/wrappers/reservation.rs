use crate::api::app::{ApiError, AppState};
use crate::db::models;
use crate::db::queries::reservation;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Reservation {
    pub id: String,
    pub court_number: i16,
    pub reservation_date: NaiveDate,
    pub reservation_time: i16,
    pub duration: String,
}

pub async fn add_reservation(
    State(state): State<AppState>,
    Json(payload): Json<Reservation>,
) -> Result<Json<Uuid>, ApiError> {
    let id: Option<Uuid> = match payload.id {
        ref s if s.is_empty() => None,
        _ => Some(Uuid::parse_str(&payload.id).expect("Couldn't parse Uuid ID from string")),
    };
    let duration: i16 = match payload.duration {
        ref s if s.is_empty() => 1,
        _ => payload
            .duration
            .parse()
            .expect("Could not convert string to i16"),
    };

    let client = state.pool.get().await?;
    let id = reservation::add_reservation(
        &client,
        &models::Reservation {
            id,
            court_number: payload.court_number,
            reservation_date: payload.reservation_date,
            reservation_time: payload.reservation_time,
            duration,
        },
    )
    .await?;
    Ok(Json(id))
}

pub async fn get_reservation(
    State(state): State<AppState>,
    Path(data): Path<Uuid>,
) -> Result<Json<models::Reservation>, ApiError> {
    let client = state.pool.get().await?;
    match reservation::get_reservation(&client, data).await {
        Ok(reservation) => Ok(Json(reservation)),
        Err(_) => Err(ApiError::NotFound),
    }
}

pub async fn get_reservations_from_day(
    State(state): State<AppState>,
    Path(date): Path<NaiveDate>,
) -> Result<Json<Vec<models::Reservation>>, ApiError> {
    let client = state.pool.get().await?;
    let reservations = reservation::get_reservations_from_date(&client, &date).await?;
    Ok(Json(reservations))
}

pub async fn update_reservation(
    State(state): State<AppState>,
    Json(payload): Json<Reservation>,
) -> Result<StatusCode, ApiError> {
    let id: Option<Uuid> = match payload.id {
        ref s if s.is_empty() => None,
        _ => Some(Uuid::parse_str(&payload.id).expect("Couldn't parse UUID from string")),
    };
    let duration: i16 = match payload.duration {
        ref s if s.is_empty() => 1,
        _ => payload
            .duration
            .parse()
            .expect("Could not convert string to i16"),
    };

    let client = state.pool.get().await?;
    let affected = reservation::update_reservation(
        &client,
        &models::Reservation {
            id,
            court_number: payload.court_number,
            reservation_date: payload.reservation_date,
            reservation_time: payload.reservation_time,
            duration,
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
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = reservation::delete_reservation(&client, id).await?;
    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

use crate::api::app::{ApiError, AppState};
use crate::db::queries::reservation_to_member;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ReservationToMember {
    pub reservation_id: String,
    pub member_id: String,
}

pub async fn add_reservation_to_member(
    State(state): State<AppState>,
    Json(payload): Json<ReservationToMember>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    reservation_to_member::add_reservation_to_member(
        &client,
        &Uuid::parse_str(&payload.reservation_id).expect("Couldn not parse UUID from string."),
        &Uuid::parse_str(&payload.member_id).expect("Couldn not parse UUID from string."),
    )
    .await?;
    Ok(StatusCode::OK)
}

pub async fn get_members_from_reservation(
    State(state): State<AppState>,
    Path(reservation_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, ApiError> {
    let client = state.pool.get().await?;
    match reservation_to_member::get_members_from_reservation(&client, &reservation_id).await {
        Ok(members_ids) => Ok(Json(members_ids)),
        Err(_) => Err(ApiError::NotFound),
    }
}

pub async fn get_reservations_from_member(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, ApiError> {
    let client = state.pool.get().await?;
    match reservation_to_member::get_reservations_from_member(&client, &member_id).await {
        Ok(reservations_ids) => Ok(Json(reservations_ids)),
        Err(_) => Err(ApiError::NotFound),
    }
}

pub async fn delete_reservation_to_member(
    State(state): State<AppState>,
    Json(payload): Json<ReservationToMember>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = reservation_to_member::delete_reservation_to_member(
        &client,
        &Uuid::parse_str(&payload.reservation_id).expect("Could not parse UUID from string."),
        &Uuid::parse_str(&payload.member_id).expect("Could not parse UUID from string."),
    )
    .await?;
    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

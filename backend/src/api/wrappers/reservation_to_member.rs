use crate::api::app::{ApiError, AppState};
use crate::db::queries::reservation_to_member;
use axum::extract::{Json, Path, State};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ReservationToMember {
    pub reservation_id: String,
    pub member_id: String,
}

pub async fn get_members_from_reservation(
    State(state): State<AppState>,
    Path(reservation_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, ApiError> {
    let client = state.pool.get().await?;
    let members_ids: Vec<Uuid> =
        reservation_to_member::get_members_from_reservation(&client, &reservation_id).await?;

    if members_ids.is_empty() {
        return Err(ApiError::NotFound);
    }

    Ok(Json(members_ids))
}

pub async fn get_reservations_from_member(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, ApiError> {
    let client = state.pool.get().await?;
    let reservations_ids: Vec<Uuid> =
        reservation_to_member::get_reservations_from_member(&client, &member_id).await?;

    if reservations_ids.is_empty() {
        return Err(ApiError::NotFound);
    }

    Ok(Json(reservations_ids))
}

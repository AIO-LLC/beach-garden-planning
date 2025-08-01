use crate::api::app::{ApiError, AppState};
use crate::db::models::Address;
use crate::db::queries::addresses;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use deadpool_postgres::Client;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct NewAddress {
    member_id: String,
    line_1: String,
    line_2: String,
    postal_code: String,
    city: String,
    country: String,
}

pub async fn add_address(
    State(state): State<AppState>,
    Json(payload): Json<NewAddress>,
) -> Result<Json<Uuid>, ApiError> {
    let client: Client = state.pool.get().await?;

    let id: Uuid = addresses::add_address(
        &client,
        &Address {
            id: None,
            member_id: Uuid::parse_str(&payload.member_id)
                .expect("Couldn't convert uuid string to uuid"),
            line_1: payload.line_1,
            line_2: Some(payload.line_2),
            postal_code: payload.postal_code,
            city: payload.city,
            country: payload.country,
        },
    )
    .await?;
    Ok(Json(id))
}

pub async fn get_address(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Address>, ApiError> {
    let client: Client = state.pool.get().await?;
    let address: Address = addresses::get_address(&client, id).await?;
    Ok(Json(address))
}

pub async fn delete_address(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let client: Client = state.pool.get().await?;
    let affected: u64 = addresses::delete_address(&client, id).await?;
    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

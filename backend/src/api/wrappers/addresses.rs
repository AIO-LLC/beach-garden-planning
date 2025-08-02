use crate::api::app::{ApiError, AppState};
use crate::db::models;
use crate::db::queries::addresses;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use deadpool_postgres::Client;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Address {
    member_id: String,
    line_1: String,
    line_2: String,
    postal_code: String,
    city: String,
    country: String,
}

pub async fn add_address(
    State(state): State<AppState>,
    Json(payload): Json<Address>,
) -> Result<Json<Uuid>, ApiError> {
    let client: Client = state.pool.get().await?;

    let id: Uuid = addresses::add_address(
        &client,
        &models::Address {
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

pub async fn get_address_by_member_id(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
) -> Result<Json<models::Address>, ApiError> {
    let client: Client = state.pool.get().await?;
    let address: models::Address = addresses::get_address_by_member_id(&client, member_id).await?;
    Ok(Json(address))
}

pub async fn update_address_by_member_id(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
    Json(payload): Json<Address>,
) -> Result<StatusCode, ApiError> {
    let line_2: Option<String> = match payload.line_2 {
        ref s if s.is_empty() => None,
        _ => Some(payload.line_2),
    };

    let client = state.pool.get().await?;
    let affected = addresses::update_address_by_member_id(
        &client,
        &models::Address {
            id: None, // Not used
            member_id,
            line_1: payload.line_1,
            line_2,
            postal_code: payload.postal_code,
            city: payload.city,
            country: payload.country,
        },
    )
    .await?;

    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

pub async fn delete_address_by_member_id(
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let client: Client = state.pool.get().await?;
    let affected: u64 = addresses::delete_address_by_member_id(&client, member_id).await?;
    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

use crate::api::app::{ApiError, AppState};
use crate::db::models::Member;
use crate::db::queries;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct NewMember {
    pub first_name: String,
    pub last_name: String,
    pub gender: String,
    pub birth_date: NaiveDate,
    pub email: String,
    pub phone: String,
    pub fft_license: String,
    pub profile_picture: String,
}

pub async fn add_member(
    State(state): State<AppState>,
    Json(payload): Json<NewMember>,
) -> Result<Json<Uuid>, ApiError> {
    let client = state.pool.get().await?;
    let id = queries::add_member(
        &client,
        &Member {
            id: None,
            first_name: payload.first_name,
            last_name: payload.last_name,
            gender: payload.gender,
            birth_date: payload.birth_date,
            email: payload.email,
            phone: payload.phone,
            fft_license: Some(payload.fft_license),
            profile_picture: Some(payload.profile_picture),
            signup_date: None,
        },
    )
    .await?;
    Ok(Json(id))
}

pub async fn get_member(
    State(state): State<AppState>,
    Path(data): Path<Uuid>,
) -> Result<Json<Member>, ApiError> {
    let client = state.pool.get().await?;
    let member = queries::get_member(&client, data).await?;
    Ok(Json(member))
}

pub async fn delete_member(
    State(state): State<AppState>,
    Path(data): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = queries::delete_member(&client, data).await?;
    if affected == 1 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(ApiError::NotFound)
    }
}

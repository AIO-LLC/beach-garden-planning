use crate::api::app::{ApiError, AppState};
use crate::db::models;
use crate::db::queries::member;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Member {
    pub id: String,
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
    Json(payload): Json<Member>,
) -> Result<Json<Uuid>, ApiError> {
    let id: Option<Uuid> = match payload.id {
        ref s if s.is_empty() => None,
        _ => Some(Uuid::parse_str(&payload.id).expect("Couldn't parse Uuid ID from string")),
    };
    let fft_license: Option<String> = match payload.fft_license {
        ref s if s.is_empty() => None,
        _ => Some(payload.fft_license),
    };
    let profile_picture: Option<String> = match payload.profile_picture {
        ref s if s.is_empty() => None,
        _ => Some(payload.profile_picture),
    };

    let client = state.pool.get().await?;
    let id = member::add_member(
        &client,
        &models::Member {
            id,
            first_name: payload.first_name,
            last_name: payload.last_name,
            gender: payload.gender,
            birth_date: payload.birth_date,
            email: payload.email,
            phone: payload.phone,
            fft_license,
            profile_picture,
            signup_date: None,
        },
    )
    .await?;
    Ok(Json(id))
}

pub async fn get_member(
    State(state): State<AppState>,
    Path(data): Path<Uuid>,
) -> Result<Json<models::Member>, ApiError> {
    let client = state.pool.get().await?;
    match member::get_member(&client, data).await {
        Ok(member) => Ok(Json(member)),
        Err(_) => Err(ApiError::NotFound),
    }
}

pub async fn get_all_members(
    State(state): State<AppState>,
) -> Result<Json<Vec<models::Member>>, ApiError> {
    let client = state.pool.get().await?;
    let members = member::get_all_members(&client).await?;
    Ok(Json(members))
}

pub async fn update_member(
    State(state): State<AppState>,
    Json(payload): Json<Member>,
) -> Result<StatusCode, ApiError> {
    let id: Option<Uuid> = match payload.id {
        ref s if s.is_empty() => None,
        _ => Some(Uuid::parse_str(&payload.id).expect("Couldn't parse UUID from string")),
    };
    let fft_license: Option<String> = match payload.fft_license {
        ref s if s.is_empty() => None,
        _ => Some(payload.fft_license),
    };
    let profile_picture: Option<String> = match payload.profile_picture {
        ref s if s.is_empty() => None,
        _ => Some(payload.profile_picture),
    };

    let client = state.pool.get().await?;
    let affected = member::update_member(
        &client,
        &models::Member {
            id,
            first_name: payload.first_name,
            last_name: payload.last_name,
            gender: payload.gender,
            birth_date: payload.birth_date,
            email: payload.email,
            phone: payload.phone,
            fft_license,
            profile_picture,
            signup_date: None, // Not used
        },
    )
    .await?;

    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

pub async fn delete_member(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = member::delete_member(&client, id).await?;
    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

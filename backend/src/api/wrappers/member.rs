use crate::api::app::{ApiError, AppState};
use crate::db::models;
use crate::db::queries::member;
use crate::utils::{gen_id, hash_password};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct MemberPayload {
    pub id: String,
    pub phone: String,
    pub password: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
}

pub async fn add_member(
    State(state): State<AppState>,
    Json(payload): Json<MemberPayload>,
) -> Result<Json<String>, ApiError> {
    let id: String = match payload.id {
        ref id if id.is_empty() => gen_id().expect("Could not generate an ID."),
        id => id,
    };

    let email: Option<String> = match payload.email {
        ref email if email.is_empty() => None,
        email => Some(email),
    };

    let first_name: Option<String> = match payload.first_name {
        ref first_name if first_name.is_empty() => None,
        first_name => Some(first_name),
    };

    let last_name: Option<String> = match payload.last_name {
        ref last_name if last_name.is_empty() => None,
        last_name => Some(last_name),
    };

    // For first log in only
    let otp: String = "123456".to_string();
    let hashed_otp: String = hash_password(&otp).expect("Could not hash password.");

    let client = state.pool.get().await?;

    let id_from_db: String = member::add_member(
        &client,
        &models::Member {
            id,
            phone: payload.phone,
            password: hashed_otp,
            email,
            first_name,
            last_name,
        },
    )
    .await?;

    // TODO: send otp by SMS

    Ok(Json(id_from_db))
}

pub async fn get_member(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<models::Member>, ApiError> {
    let client = state.pool.get().await?;
    match member::get_member(&client, &id).await {
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
    Json(payload): Json<MemberPayload>,
) -> Result<StatusCode, ApiError> {
    let hashed_password: String =
        hash_password(&payload.password).expect("Could not hash the password.");

    let email: Option<String> = match payload.email {
        ref email if email.is_empty() => None,
        email => Some(email),
    };

    let first_name: Option<String> = match payload.first_name {
        ref first_name if first_name.is_empty() => None,
        first_name => Some(first_name),
    };

    let last_name: Option<String> = match payload.last_name {
        ref last_name if last_name.is_empty() => None,
        last_name => Some(last_name),
    };

    let client = state.pool.get().await?;
    let affected = member::update_member(
        &client,
        &models::Member {
            id: payload.id,
            phone: payload.phone,
            password: hashed_password,
            email,
            first_name,
            last_name,
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
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    let client = state.pool.get().await?;
    let affected = member::delete_member(&client, &id).await?;
    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

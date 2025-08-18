use crate::api::app::{ApiError, AppState};
use crate::db::models::{self, PasswordResetToken};
use crate::db::queries::{member, password_reset_token};
use crate::utils::{gen_id, hash_password};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::response::IntoResponse;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::Response,
};
use chrono::Local;
use rand::{Rng, rng};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct MemberPayload {
    pub id: String,
    pub phone: String,
    pub password: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Deserialize)]
pub struct UpdateMemberPayload {
    pub id: String,
    pub phone: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Deserialize)]
pub struct EditPasswordPayload {
    pub id: String,
    pub current_password: String,
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct PasswordResetPayload {
    pub token: Uuid,
    pub email: String,
    pub new_password: String,
}

pub async fn add_member(
    State(state): State<AppState>,
    Json(payload): Json<MemberPayload>,
) -> Result<Response, ApiError> {
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
    let otp: String = (0..6)
        .map(|_| rng().random_range(0..10).to_string())
        .collect();
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
            is_admin: false,
        },
    )
    .await?;

    let response = (
        StatusCode::OK,
        Json(json!({
            "member_id": id_from_db,
            "otp": otp,
        })),
    )
        .into_response();

    Ok(response)
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
    Json(payload): Json<UpdateMemberPayload>,
) -> Result<StatusCode, ApiError> {
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
            password: "".to_string(), // Unused
            email,
            first_name,
            last_name,
            is_admin: false,
        },
    )
    .await?;

    if affected == 1 {
        Ok(StatusCode::OK)
    } else {
        Err(ApiError::NotFound)
    }
}

pub async fn update_member_with_password(
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
    let affected = member::update_member_with_password(
        &client,
        &models::Member {
            id: payload.id,
            phone: payload.phone,
            password: hashed_password,
            email,
            first_name,
            last_name,
            is_admin: false,
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

pub async fn update_password(
    State(state): State<AppState>,
    Json(payload): Json<EditPasswordPayload>,
) -> Result<Response, ApiError> {
    let client = state.pool.get().await?;

    // Check if current_password is correct
    let member: models::Member = member::get_member(&client, &payload.id).await?;

    let parsed_hash = PasswordHash::new(&member.password).map_err(|_| ApiError::NotFound)?;

    if Argon2::default()
        .verify_password(payload.current_password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err(ApiError::WrongCredentials);
    }

    // Check if new_password == current_password -> Error
    if payload.current_password.eq(&payload.new_password) {
        return Err(ApiError::NewPasswordMustBeDifferent);
    }

    // Hash new_password
    let hashed_new_password: String =
        hash_password(&payload.new_password).expect("Could not hash new password.");

    // Store hash in db
    let affected =
        member::update_member_password(&client, &member.id, &hashed_new_password).await?;

    if affected == 1 {
        let response = (
            StatusCode::OK,
            Json(json!({
                "message": "Password updated successfully.",
            })),
        )
            .into_response();

        Ok(response)
    } else {
        Err(ApiError::NotFound)
    }
}

pub async fn password_reset(
    State(state): State<AppState>,
    Json(payload): Json<PasswordResetPayload>,
) -> Result<Response, ApiError> {
    let client = state.pool.get().await?;

    // Check if token is still valid. If not return
    let token_from_db: PasswordResetToken =
        match password_reset_token::get_token_info(&client, &payload.token).await {
            Ok(token_from_db) => {
                if token_from_db.expires_at < Local::now().naive_local() {
                    return Err(ApiError::TokenExpired);
                }
                token_from_db
            }
            Err(_) => return Err(ApiError::TokenExpired),
        };

    // Hash new_password
    let hashed_new_password: String =
        hash_password(&payload.new_password).expect("Could not hash new password.");

    // Store hash in db
    let affected =
        member::update_member_password(&client, &token_from_db.member_id, &hashed_new_password)
            .await?;

    if affected == 1 {
        let response = (
            StatusCode::OK,
            Json(json!({
                "message": "Password updated successfully.",
            })),
        )
            .into_response();

        Ok(response)
    } else {
        Err(ApiError::NotFound)
    }
}

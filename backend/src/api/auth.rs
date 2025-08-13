use crate::api::app::{ApiError, AppState};
use crate::db::{models, queries};
use crate::jwt::{create_jwt, verify_jwt};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::{Json, State};
use axum::http::{StatusCode, header::SET_COOKIE};
use axum::response::{IntoResponse, Response};
use axum_extra::extract::CookieJar;
use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LoginPayload {
    phone: String,
    password: String,
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> Result<Response, ApiError> {
    let client = state.pool.get().await?;
    let member: models::Member =
        queries::member::get_member_by_phone(&client, &payload.phone).await?;

    let parsed_hash = PasswordHash::new(&member.password).map_err(|_| ApiError::NotFound)?;

    if Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err(ApiError::NotFound);
    }

    let is_profile_complete: bool =
        member.email.is_some() && member.first_name.is_some() && member.last_name.is_some();
    let token: String =
        create_jwt(&member.id, &member.phone, is_profile_complete).expect("Could not create JWT.");

    let flags = if cfg!(debug_assertions) {
        ""
    } else {
        "; Secure"
    };
    let cookie =
        format!("auth_token={token}; HttpOnly; SameSite=Strict; Max-Age=86400; Path=/{flags}");

    let mut response = (
        StatusCode::OK,
        Json(json!({
            "message": "Login successful",
            "is_profile_complete": is_profile_complete
        })),
    )
        .into_response();

    response
        .headers_mut()
        .insert(SET_COOKIE, cookie.parse().unwrap());

    Ok(response)
}

pub async fn logout() -> impl IntoResponse {
    let flags = if cfg!(debug_assertions) {
        ""
    } else {
        "; Secure"
    };
    let cookie = format!("auth_token=; HttpOnly; SameSite=Strict; Max-Age=86400; Path=/{flags}");

    (
        StatusCode::NO_CONTENT,
        [(SET_COOKIE, cookie)],
        "", // empty body
    )
}

pub async fn get_jwt_claims(
    State(_state): State<AppState>,
    jar: CookieJar,
) -> Result<impl IntoResponse, ApiError> {
    let token = jar.get("auth_token").ok_or(ApiError::NotFound)?.value();

    let claims = verify_jwt(token).map_err(|_| ApiError::NotFound)?;

    Ok(Json(json!({
        "id": claims.sub,
        "phone": claims.phone,
        "is_profile_complete": claims.is_profile_complete,
    }))
    .into_response())
}

pub struct PasswordResetToken {
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

impl PasswordResetToken {
    pub fn generate() -> Self {
        Self {
            token: Uuid::new_v4().to_string(),
            expires_at: Utc::now() + Duration::hours(1),
        }
    }
}

#[derive(Deserialize)]
pub struct PasswordForgottenPayload {
    pub email: String,
}

use crate::api::email::EmailService;

pub async fn password_forgotten(
    State(_state): State<AppState>,
    Json(payload): Json<PasswordForgottenPayload>,
) -> Result<Response, ApiError> {
    let email_service = EmailService::new(
        "smtp.gmail.com",
        "anto.benedetti.pro@gmail.com",
        "qdha ekaz lmal cpoa",
        "noreply@beachgardensxm.fr".to_string(),
    );

    let reset_token = PasswordResetToken::generate();

    match email_service
        .send_password_reset_email(
            &payload.email,
            &reset_token.token,
            "http://192.168.1.113:3000/reset-password",
        )
        .await
    {
        Ok(()) => println!(
            "Password reset email sent with token: {}",
            reset_token.token
        ),
        Err(error) => {
            println!("{error:?}");
            return Err(ApiError::NotFound);
        }
    }

    Ok((StatusCode::OK).into_response())
}

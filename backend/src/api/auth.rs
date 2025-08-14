use crate::api::app::{ApiError, AppState};
use crate::api::email::EmailService;
use crate::db::{models, queries};
use crate::jwt::{create_jwt, verify_jwt};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::{Json, State};
use axum::http::{StatusCode, header::SET_COOKIE};
use axum::response::{IntoResponse, Response};
use axum_extra::extract::CookieJar;
use dotenvy::dotenv;
use serde::Deserialize;
use serde_json::json;
use std::env;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LoginPayload {
    phone: String,
    password: String,
}

#[derive(Deserialize)]
pub struct RefreshJwtPayload {
    member_id: String,
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

#[derive(Deserialize)]
pub struct PasswordForgottenPayload {
    pub email: String,
}

pub async fn password_forgotten(
    State(state): State<AppState>,
    Json(payload): Json<PasswordForgottenPayload>,
) -> Result<Response, ApiError> {
    dotenv().ok();
    let smtp_server: String =
        env::var("SMTP_SERVER").expect("Undefined SMTP_SERVER environment variable");
    let smtp_user: String =
        env::var("SMTP_USER").expect("Undefined SMTP_USER environment variable");
    let smtp_password: String =
        env::var("SMTP_PASSWORD").expect("Undefined SMTP_PASSWORD environment variable");
    let smtp_sender: String =
        env::var("SMTP_SENDER").expect("Undefined SMTP_SENDER environment variable");
    let api_ip: &str = &env::var("API_IP").unwrap_or("0.0.0.0".to_string());

    let email_service = EmailService::new(&smtp_server, &smtp_user, &smtp_password, &smtp_sender);

    let client = state.pool.get().await?;
    let member: models::Member =
        match queries::member::get_member_by_email(&client, &payload.email).await {
            Ok(member) => member,
            Err(_) => return Ok((StatusCode::OK).into_response()), // Return OK for email enumeration protection
        };

    let token: Uuid = queries::password_reset_token::create_token(&client, &member.id).await?;

    match email_service
        .send_password_reset_email(
            &payload.email,
            &member.first_name.unwrap(),
            &token,
            &format!("http://{api_ip}:3000/password-reset"),
        )
        .await
    {
        Ok(()) => println!("Password reset email sent with token: {token}",),
        Err(error) => {
            println!("{error:?}");
            return Err(ApiError::NotFound); // TODO: return a better error
        }
    }

    Ok((StatusCode::OK).into_response())
}

pub async fn refresh_jwt(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<RefreshJwtPayload>,
) -> Result<Response, ApiError> {
    // Get the current JWT token from cookies
    let token = jar.get("auth_token").ok_or(ApiError::NotFound)?.value();

    // Verify the current token is valid (but might have outdated claims)
    let _ = match verify_jwt(token) {
        Ok(claims) => claims,
        Err(_) => return Err(ApiError::WrongCredentials),
    };

    // Fetch the latest user data from database
    let client = state.pool.get().await?;
    let member: models::Member = queries::member::get_member(&client, &payload.member_id).await?;
    let is_profile_complete: bool =
        member.email.is_some() && member.first_name.is_some() && member.last_name.is_some();

    // Create a new JWT with updated profile completion status
    let new_token: String =
        create_jwt(&member.id, &member.phone, is_profile_complete).expect("Could not create JWT.");

    // Set the new token in cookies
    let flags = if cfg!(debug_assertions) {
        ""
    } else {
        "; Secure"
    };
    let cookie =
        format!("auth_token={new_token}; HttpOnly; SameSite=Strict; Max-Age=86400; Path=/{flags}");

    let mut response = (
        StatusCode::OK,
        Json(json!({
            "message": "JWT refreshed successfully",
            "is_profile_complete": is_profile_complete
        })),
    )
        .into_response();

    response
        .headers_mut()
        .insert(SET_COOKIE, cookie.parse().unwrap());

    Ok(response)
}

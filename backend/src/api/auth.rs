use crate::api::app::{ApiError, AppState};
use crate::api::email::EmailService;
use crate::db::{models, queries};
use crate::jwt::{create_jwt, verify_jwt};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::{Json, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
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

// Login endpoint that returns JWT token in response body
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> Result<Response, ApiError> {
    tracing::debug!("Login attempt for phone: {}", payload.phone);

    let client = state.pool.get().await.map_err(|e| {
        tracing::error!("Failed to get database connection: {:?}", e);
        ApiError::Pool(e)
    })?;

    let member: models::Member = queries::member::get_member_by_phone(&client, &payload.phone)
        .await
        .map_err(|e| {
            tracing::warn!("Member not found for phone {}: {:?}", payload.phone, e);
            ApiError::NotFound
        })?;

    let parsed_hash = PasswordHash::new(&member.password).map_err(|e| {
        tracing::error!("Failed to parse password hash: {:?}", e);
        ApiError::NotFound
    })?;

    if let Err(e) = Argon2::default().verify_password(payload.password.as_bytes(), &parsed_hash) {
        tracing::warn!("Invalid password for user {}: {:?}", member.id, e);
        return Err(ApiError::NotFound);
    }

    let is_profile_complete: bool =
        member.email.is_some() && member.first_name.is_some() && member.last_name.is_some();

    let token: String = create_jwt(
        &member.id,
        &member.phone,
        is_profile_complete,
        member.is_admin,
    )
    .map_err(|e| {
        tracing::error!("Failed to create JWT for user {}: {:?}", member.id, e);
        ApiError::WrongCredentials
    })?;

    tracing::info!("User {} logged in successfully", member.id);

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Login successful",
            "token": token,
            "id": member.id,
            "phone": member.phone,
            "is_profile_complete": is_profile_complete,
            "is_admin": member.is_admin
        })),
    )
        .into_response())
}

// Logout endpoint (mainly for logging purposes, actual logout happens client-side)
pub async fn logout(headers: HeaderMap) -> impl IntoResponse {
    // Extract user info from token if provided (for logging)
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                if let Ok(claims) = verify_jwt(token) {
                    tracing::info!("User {} logged out", claims.sub);
                }
            }
        }
    }

    (StatusCode::NO_CONTENT, "")
}

// Verify token endpoint - used by frontend to validate stored tokens
pub async fn verify_token(
    State(_state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, ApiError> {
    // Extract token from Authorization header
    let token = extract_token_from_headers(&headers)?;

    // Verify and decode the JWT
    let claims = match verify_jwt(&token) {
        Ok(claims) => claims,
        Err(jwt_error) => {
            tracing::debug!("JWT verification failed: {}", jwt_error);
            match jwt_error.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    return Err(ApiError::TokenExpired);
                }
                jsonwebtoken::errors::ErrorKind::InvalidToken
                | jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    return Err(ApiError::InvalidAuthToken);
                }
                _ => {
                    tracing::error!("JWT verification error: {}", jwt_error);
                    return Err(ApiError::WrongCredentials);
                }
            }
        }
    };

    Ok(Json(json!({
        "id": claims.sub,
        "phone": claims.phone,
        "is_profile_complete": claims.is_profile_complete,
        "is_admin": claims.is_admin
    }))
    .into_response())
}

// Helper function to extract token from Authorization header
pub fn extract_token_from_headers(headers: &HeaderMap) -> Result<String, ApiError> {
    let auth_header = headers
        .get("Authorization")
        .ok_or(ApiError::MissingAuthToken)?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| ApiError::InvalidAuthToken)?;

    if !auth_str.starts_with("Bearer ") {
        return Err(ApiError::InvalidAuthToken);
    }

    Ok(auth_str[7..].to_string())
}

// Middleware function to verify JWT from headers (for protected routes)
pub async fn require_auth(
    headers: HeaderMap,
    State(_state): State<AppState>,
) -> Result<crate::jwt::Claims, ApiError> {
    let token = extract_token_from_headers(&headers)?;

    match verify_jwt(&token) {
        Ok(claims) => Ok(claims),
        Err(jwt_error) => {
            tracing::debug!("JWT verification failed in middleware: {}", jwt_error);
            match jwt_error.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => Err(ApiError::TokenExpired),
                _ => Err(ApiError::InvalidAuthToken),
            }
        }
    }
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

    let base_url: String;

    #[cfg(feature = "local")]
    {
        let frontend_ip: &str =
            &env::var("FRONTEND_IP").expect("Undefined FRONTEND_IP environment variable");
        let frontend_port: &str =
            &env::var("FRONTEND_PORT").expect("Undefined FRONTEND_PORT environment variable");
        base_url = format!("http://{frontend_ip}:{frontend_port}");
    }

    #[cfg(not(feature = "local"))]
    {
        let public_url: &str = &env::var("CUSTOM_DOMAIN_URL")
            .expect("Undefined CUSTOM_DOMAIN_URL environment variable");

        base_url = public_url.to_string();
    }

    let email_service = EmailService::new(&smtp_server, &smtp_user, &smtp_password, &smtp_sender);

    let client = state.pool.get().await?;
    let member: models::Member =
        match queries::member::get_member_by_email(&client, &payload.email).await {
            Ok(member) => member,
            Err(_) => return Ok((StatusCode::OK).into_response()),
        };

    let token: Uuid = queries::password_reset_token::create_token(&client, &member.id).await?;

    match email_service
        .send_password_reset_email(
            &payload.email,
            &member.first_name.unwrap(),
            &token,
            &format!("{base_url}/password-reset"),
        )
        .await
    {
        Ok(()) => println!("Password reset email sent with token: {token}",),
        Err(error) => {
            println!("{error:?}");
            return Err(ApiError::NotFound);
        }
    }

    Ok((StatusCode::OK).into_response())
}

// Refresh JWT endpoint - creates new token with updated claims
pub async fn refresh_jwt(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<RefreshJwtPayload>,
) -> Result<Response, ApiError> {
    // Verify the current token is valid
    let token = extract_token_from_headers(&headers)?;
    let _ = verify_jwt(&token).map_err(|_| ApiError::WrongCredentials)?;

    // Fetch the latest user data from database
    let client = state.pool.get().await?;
    let member: models::Member = queries::member::get_member(&client, &payload.member_id).await?;
    let is_profile_complete: bool =
        member.email.is_some() && member.first_name.is_some() && member.last_name.is_some();

    // Create a new JWT with updated profile completion status
    let new_token: String = create_jwt(
        &member.id,
        &member.phone,
        is_profile_complete,
        member.is_admin,
    )
    .expect("Could not create JWT.");

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "JWT refreshed successfully",
            "token": new_token,
            "is_profile_complete": is_profile_complete,
            "is_admin": member.is_admin
        })),
    )
        .into_response())
}

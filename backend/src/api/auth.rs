use crate::api::app::{ApiError, AppState};
use crate::db::{models, queries};
use crate::jwt::create_jwt;
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::{Json, State};
use axum::http::{StatusCode, header::SET_COOKIE};
use axum::response::{IntoResponse, Response};
use serde::Deserialize;

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

    let token: String = create_jwt(&member.phone).expect("Could not create JWT.");

    let flags = if cfg!(debug_assertions) {
        ""
    } else {
        "; Secure"
    };
    let cookie =
        format!("auth_token={token}; HttpOnly; SameSite=Strict; Max-Age=86400; Path=/{flags}");
    println!("{cookie}");

    let mut response = (
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Login successful"
        })),
    )
        .into_response();

    response
        .headers_mut()
        .insert(SET_COOKIE, cookie.parse().unwrap());

    Ok(response)
}

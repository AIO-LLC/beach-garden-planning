use chrono::{Duration, Utc};
use dotenvy::dotenv;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    exp: usize,
    iat: usize,
    pub phone: String,
    pub is_profile_complete: bool,
    pub is_admin: bool,
}

fn get_secret() -> String {
    dotenv().ok();
    env::var("JWT_SECRET").expect("Undefined JWT_SECRET environment variable")
}

pub fn create_jwt(
    id: &str,
    phone: &str,
    is_profile_complete: bool,
    is_admin: bool,
) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: id.to_string(),
        exp: expiration,
        iat: Utc::now().timestamp() as usize,
        phone: phone.to_string(),
        is_profile_complete,
        is_admin,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(get_secret().as_ref()),
    )
}

pub fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(get_secret().as_ref()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}

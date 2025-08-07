// use chrono::{Duration, Utc};
// use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
// use serde::{Deserialize, Serialize};
//
// #[derive(Debug, Serialize, Deserialize)]
// struct Claims {
//     sub: String, // subject (email)
//     exp: usize,  // expiration time
//     iat: usize,  // issued at
// }
//
// const JWT_SECRET: &str = "secret-key"; // TODO: use .env
//
// pub fn create_jwt(email: &str) -> Result<String, jsonwebtoken::errors::Error> {
//     let expiration = Utc::now()
//         .checked_add_signed(Duration::hours(24))
//         .expect("valid timestamp")
//         .timestamp() as usize;
//
//     let claims = Claims {
//         sub: email.to_string(),
//         exp: expiration,
//         iat: Utc::now().timestamp() as usize,
//     };
//
//     encode(
//         &Header::default(),
//         &claims,
//         &EncodingKey::from_secret(JWT_SECRET.as_ref()),
//     )
// }
//
// pub fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
//     decode::<Claims>(
//         token,
//         &DecodingKey::from_secret(JWT_SECRET.as_ref()),
//         &Validation::default(),
//     )
//     .map(|data| data.claims)
// }

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct Member {
    pub id: Option<Uuid>,
    pub first_name: String,
    pub last_name: String,
    pub gender: String,
    pub birth_date: NaiveDate,
    pub email: String,
    pub phone: String,
    pub fft_license: Option<String>,
    pub profile_picture: Option<String>,
    pub signup_date: Option<NaiveDate>,
}

#[derive(Serialize)]
pub struct Address {
    pub id: Option<Uuid>,
    pub member_id: Uuid,
    pub line_1: String,
    pub line_2: Option<String>,
    pub postal_code: String,
    pub city: String,
    pub country: String,
}

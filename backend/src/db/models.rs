use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct Member {
    pub id: String,
    pub phone: String,
    pub password: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub is_admin: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Reservation {
    pub id: String,
    pub member_id: String,
    pub court_number: i16,
    pub reservation_date: NaiveDate,
    pub reservation_time: i16,
}

#[derive(Debug, Serialize)]
pub struct ReservationWithNames {
    pub id: String,
    pub member_id: String,
    pub court_number: i16,
    pub reservation_date: NaiveDate,
    pub reservation_time: i16,
    pub member_first_name: String,
    pub member_last_name: String,
}

#[derive(Debug)]
pub struct PasswordResetToken {
    pub token: Uuid,
    pub member_id: String,
    pub expires_at: NaiveDateTime,
}

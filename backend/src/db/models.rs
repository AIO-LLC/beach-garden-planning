use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Member {
    pub id: String,
    pub phone: String,
    pub password: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Reservation {
    pub id: String,
    pub member_id: String,
    pub court_number: i16,
    pub reservation_date: NaiveDate,
    pub reservation_time: i16,
}

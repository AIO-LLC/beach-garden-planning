use chrono::{NaiveDate, NaiveTime};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Event {
    pub id: i32,
    pub name: String,
    pub date: NaiveDate,
    pub time: NaiveTime,
}

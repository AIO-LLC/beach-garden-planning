use chrono::{NaiveDate, NaiveTime};

#[derive(Debug)]
pub struct Event {
    pub id: i32,
    pub name: String,
    pub date: NaiveDate,
    pub time: NaiveTime,
}

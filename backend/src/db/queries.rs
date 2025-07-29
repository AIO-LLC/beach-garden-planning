use crate::db::models::Event;
use chrono::{NaiveDate, NaiveTime};
use tokio_postgres::{Client, Error, Row, Statement};

pub async fn insert_into_events(
    client: &Client,
    name: &str,
    date: NaiveDate,
    time: NaiveTime,
) -> Result<i32, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO events (name, date, time) VALUES ($1, $2, $3) RETURNING id")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[&name, &date, &time]).await?;

    rows[0].try_get("id")
}

pub async fn get_day_events(client: &Client, date: NaiveDate) -> Result<Vec<Event>, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM events WHERE date = $1")
        .await?;

    client
        .query(&stmt, &[&date])
        .await?
        .into_iter()
        .map(|row| -> Result<Event, Error> {
            Ok(Event {
                id: row.try_get("id")?,
                name: row.try_get("name")?,
                date: row.try_get("date")?,
                time: row.try_get("time")?,
            })
        })
        .collect()
}

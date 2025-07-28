use chrono::{NaiveDate, NaiveTime};
use tokio_postgres::Client;

pub async fn insert_into_events(
    client: &Client,
    name: &str,
    date: NaiveDate,
    time: NaiveTime,
) -> i32 {
    let row = client
        .query_one(
            "INSERT INTO events (name, date, time) VALUES ($1, $2, $3) RETURNING id",
            &[&name, &date, &time],
        )
        .await
        .expect("Couldn't insert into events table");

    row.get(0)
}

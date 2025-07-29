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

    Ok(rows[0].get(0))
}

use crate::db::models::Reservation;
use chrono::NaiveDate;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_reservation(
    client: &Client,
    reservation: &Reservation,
    member_id: &Uuid,
) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO reservation (court_number, reservation_date, reservation_time, duration) VALUES ($1, $2, $3, $4) RETURNING id")
        .await?;

    let row: Row = client
        .query_one(
            &stmt,
            &[
                &reservation.court_number,
                &reservation.reservation_date,
                &reservation.reservation_time,
                &reservation.duration,
            ],
        )
        .await?;

    let reservation_id: Uuid = row.try_get("id")?;

    let stmt: Statement = client
        .prepare("INSERT INTO reservation_to_member (reservation_id, member_id) VALUES ($1, $2)")
        .await?;
    client.execute(&stmt, &[&reservation_id, member_id]).await?;

    Ok(reservation_id)
}

pub async fn get_reservation(client: &Client, id: Uuid) -> Result<Reservation, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM reservation WHERE id = $1")
        .await?;

    let row: Row = client.query_one(&stmt, &[&id]).await?;

    Ok(Reservation {
        id: row.try_get("id")?,
        court_number: row.try_get("court_number")?,
        reservation_date: row.try_get("reservation_date")?,
        reservation_time: row.try_get("reservation_time")?,
        duration: row.try_get("duration")?,
    })
}

pub async fn get_reservations_by_date(
    client: &Client,
    date: &NaiveDate,
) -> Result<Vec<Reservation>, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM reservation WHERE reservation_date = $1")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[date]).await?;

    rows.into_iter()
        .map(|row| -> Result<Reservation, Error> {
            Ok(Reservation {
                id: row.try_get("id")?,
                court_number: row.try_get("court_number")?,
                reservation_date: row.try_get("reservation_date")?,
                reservation_time: row.try_get("reservation_time")?,
                duration: row.try_get("duration")?,
            })
        })
        .collect()
}

pub async fn update_reservation(
    client: &Client,
    updated_reservation: &Reservation,
) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("UPDATE reservation SET court_number = $1, reservation_date = $2, reservation_time = $3, duration = $4 WHERE id = $5").await?;

    client
        .execute(
            &stmt,
            &[
                &updated_reservation.court_number,
                &updated_reservation.reservation_date,
                &updated_reservation.reservation_time,
                &updated_reservation.duration,
                &updated_reservation.id,
            ],
        )
        .await
}

pub async fn delete_reservation(client: &Client, id: Uuid) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("DELETE FROM reservation WHERE id = $1")
        .await?;
    client.execute(&stmt, &[&id]).await
}

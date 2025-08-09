use crate::db::models::{Reservation, ReservationWithNames};
use chrono::NaiveDate;
use tokio_postgres::{Client, Error, Row, Statement};

pub async fn add_reservation(client: &Client, reservation: &Reservation) -> Result<String, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO reservation (id, member_id, court_number, reservation_date, reservation_time) VALUES ($1, $2, $3, $4, $5) RETURNING id")
        .await?;

    let row: Row = client
        .query_one(
            &stmt,
            &[
                &reservation.id,
                &reservation.member_id,
                &reservation.court_number,
                &reservation.reservation_date,
                &reservation.reservation_time,
            ],
        )
        .await?;

    let id: String = row.try_get("id")?;
    Ok(id)
}

pub async fn get_reservation(client: &Client, id: &String) -> Result<Reservation, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM reservation WHERE id=$1")
        .await?;

    let row: Row = client.query_one(&stmt, &[id]).await?;

    Ok(Reservation {
        id: row.try_get("id")?,
        member_id: row.try_get("member_id")?,
        court_number: row.try_get("court_number")?,
        reservation_date: row.try_get("reservation_date")?,
        reservation_time: row.try_get("reservation_time")?,
    })
}

pub async fn get_reservations_with_names_by_date(
    client: &Client,
    date: &NaiveDate,
) -> Result<Vec<ReservationWithNames>, Error> {
    let stmt: Statement = client
        .prepare(
            "
            SELECT
              r.id,
              r.member_id,
              r.court_number,
              r.reservation_date,
              r.reservation_time,
              m.first_name,
              m.last_name
            FROM reservation r
            JOIN member m ON r.member_id = m.id
            WHERE r.reservation_date = $1
            ORDER BY r.reservation_time, r.court_number
            ",
        )
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[date]).await?;

    rows.into_iter()
        .map(|row| {
            Ok(ReservationWithNames {
                id: row.try_get("id")?,
                member_id: row.try_get("member_id")?,
                court_number: row.try_get("court_number")?,
                reservation_date: row.try_get("reservation_date")?,
                reservation_time: row.try_get("reservation_time")?,
                member_first_name: row.try_get("first_name")?,
                member_last_name: row.try_get("last_name")?,
            })
        })
        .collect()
}

pub async fn update_reservation(
    client: &Client,
    updated_reservation: &Reservation,
) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("UPDATE reservation SET member_id=$1, court_number=$2, reservation_date=$3, reservation_time=$4 WHERE id=$5").await?;

    client
        .execute(
            &stmt,
            &[
                &updated_reservation.court_number,
                &updated_reservation.member_id,
                &updated_reservation.reservation_date,
                &updated_reservation.reservation_time,
                &updated_reservation.id,
            ],
        )
        .await
}

pub async fn delete_reservation(client: &Client, id: &String) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("DELETE FROM reservation WHERE id=$1")
        .await?;
    client.execute(&stmt, &[id]).await
}

use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_reservation_to_member(
    client: &Client,
    reservation_id: &Uuid,
    member_id: &Uuid,
) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO reservation_to_member (reservation_id, member_id) VALUES ($1, $2)")
        .await?;

    client.execute(&stmt, &[reservation_id, member_id]).await
}

pub async fn get_members_from_reservation(
    client: &Client,
    reservation_id: &Uuid,
) -> Result<Vec<Uuid>, Error> {
    let stmt: Statement = client
        .prepare("SELECT member_id FROM reservation_to_member WHERE reservation_id = $1")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[reservation_id]).await?;

    rows.into_iter()
        .map(|row| -> Result<Uuid, Error> { row.try_get("member_id") })
        .collect()
}

pub async fn get_reservations_from_member(
    client: &Client,
    member_id: &Uuid,
) -> Result<Vec<Uuid>, Error> {
    let stmt: Statement = client
        .prepare("SELECT reservation_id FROM reservation_to_member WHERE member_id = $1")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[member_id]).await?;

    rows.into_iter()
        .map(|row| -> Result<Uuid, Error> { row.try_get("reservation_id") })
        .collect()
}

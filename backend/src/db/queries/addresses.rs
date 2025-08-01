use crate::db::models::Address;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_address(client: &Client, address: &Address) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO addresses (member_id, line_1, line_2, postal_code, city, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
        .await?;

    let line_2: &Option<String> = match address.line_2 {
        Some(ref s) if s.is_empty() => &None,
        _ => &address.line_2,
    };

    let rows: Vec<Row> = client
        .query(
            &stmt,
            &[
                &address.member_id,
                &address.line_1,
                line_2,
                &address.postal_code,
                &address.city,
                &address.country,
            ],
        )
        .await?;

    rows[0].try_get("id")
}

pub async fn get_address_by_member_id(client: &Client, member_id: Uuid) -> Result<Address, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM addresses WHERE member_id = $1")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[&member_id]).await?;

    Ok(Address {
        id: rows[0].try_get("id")?,
        member_id: rows[0].try_get("member_id")?,
        line_1: rows[0].try_get("line_1")?,
        line_2: rows[0].try_get("line_2")?,
        postal_code: rows[0].try_get("postal_code")?,
        city: rows[0].try_get("city")?,
        country: rows[0].try_get("country")?,
    })
}

pub async fn delete_address(client: &Client, id: Uuid) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("DELETE FROM addresses WHERE id = $1")
        .await?;
    client.execute(&stmt, &[&id]).await
}

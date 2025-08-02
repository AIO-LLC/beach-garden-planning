use crate::db::models::Address;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_address(client: &Client, address: &Address) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO address (member_id, line_1, line_2, postal_code, city, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
        .await?;

    let line_2: &Option<String> = match address.line_2 {
        Some(ref s) if s.is_empty() => &None,
        _ => &address.line_2,
    };

    let row: Row = client
        .query_one(
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

    row.try_get("id")
}

pub async fn get_address_by_member_id(client: &Client, member_id: Uuid) -> Result<Address, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM address WHERE member_id = $1")
        .await?;

    let row: Row = client.query_one(&stmt, &[&member_id]).await?;

    Ok(Address {
        id: row.try_get("id")?,
        member_id: row.try_get("member_id")?,
        line_1: row.try_get("line_1")?,
        line_2: row.try_get("line_2")?,
        postal_code: row.try_get("postal_code")?,
        city: row.try_get("city")?,
        country: row.try_get("country")?,
    })
}

pub async fn update_address_by_member_id(
    client: &Client,
    updated_address: &Address,
) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("UPDATE address SET line_1 = $1, line_2 = $2, postal_code = $3, city = $4, country = $5 WHERE member_id = $6").await?;

    client
        .execute(
            &stmt,
            &[
                &updated_address.line_1,
                &updated_address.line_2,
                &updated_address.postal_code,
                &updated_address.city,
                &updated_address.country,
                &updated_address.member_id,
            ],
        )
        .await
}

pub async fn delete_address_by_member_id(client: &Client, member_id: Uuid) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("DELETE FROM address WHERE member_id = $1")
        .await?;
    client.execute(&stmt, &[&member_id]).await
}

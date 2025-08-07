use crate::db::models::Member;
use tokio_postgres::{Client, Error, Row, Statement};

pub async fn add_member(client: &Client, member: &Member) -> Result<String, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO member (id, phone, password, email, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
        .await?;

    let row: Row = client
        .query_one(
            &stmt,
            &[
                &member.id,
                &member.phone,
                &member.password,
                &member.email,
                &member.first_name,
                &member.last_name,
            ],
        )
        .await?;

    let id: String = row.try_get("id")?;
    Ok(id)
}

pub async fn get_member(client: &Client, id: &String) -> Result<Member, Error> {
    let stmt: Statement = client.prepare("SELECT * FROM member WHERE id=$1").await?;

    let row: Row = client.query_one(&stmt, &[&id]).await?;

    Ok(Member {
        id: row.try_get("id")?,
        phone: row.try_get("phone")?,
        password: row.try_get("password")?,
        email: row.try_get("email")?,
        first_name: row.try_get("first_name")?,
        last_name: row.try_get("last_name")?,
    })
}

pub async fn get_all_members(client: &Client) -> Result<Vec<Member>, Error> {
    let rows: Vec<Row> = client.query("SELECT * FROM member", &[]).await?;

    rows.into_iter()
        .map(|row| -> Result<Member, Error> {
            Ok(Member {
                id: row.try_get("id")?,
                phone: row.try_get("phone")?,
                password: row.try_get("password")?,
                email: row.try_get("email")?,
                first_name: row.try_get("first_name")?,
                last_name: row.try_get("last_name")?,
            })
        })
        .collect()
}

pub async fn update_member(client: &Client, updated_member: &Member) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("UPDATE member SET phone=$1, password=$2, email=$3, first_name=$4, last_name=$5 WHERE id=$6").await?;

    client
        .execute(
            &stmt,
            &[
                &updated_member.phone,
                &updated_member.password,
                &updated_member.email,
                &updated_member.first_name,
                &updated_member.last_name,
                &updated_member.id,
            ],
        )
        .await
}

pub async fn delete_member(client: &Client, id: &String) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("DELETE FROM member WHERE id=$1").await?;
    client.execute(&stmt, &[&id]).await
}

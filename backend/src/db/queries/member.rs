use crate::db::models::Member;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_member(client: &Client, member: &Member) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO member (first_name, last_name, gender, birth_date, email, phone, fft_license, profile_picture) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id")
        .await?;

    let row: Row = client
        .query_one(
            &stmt,
            &[
                &member.first_name,
                &member.last_name,
                &member.gender,
                &member.birth_date,
                &member.email,
                &member.phone,
                &member.fft_license,
                &member.profile_picture,
            ],
        )
        .await?;

    row.try_get("id")
}

pub async fn get_member(client: &Client, id: Uuid) -> Result<Member, Error> {
    let stmt: Statement = client.prepare("SELECT * FROM member WHERE id = $1").await?;

    let row: Row = client.query_one(&stmt, &[&id]).await?;

    Ok(Member {
        id: row.try_get("id")?,
        first_name: row.try_get("first_name")?,
        last_name: row.try_get("last_name")?,
        gender: row.try_get("gender")?,
        birth_date: row.try_get("birth_date")?,
        email: row.try_get("email")?,
        phone: row.try_get("phone")?,
        fft_license: row.try_get("fft_license")?,
        profile_picture: row.try_get("profile_picture")?,
        signup_date: row.try_get("signup_date")?,
    })
}

pub async fn get_all_members(client: &Client) -> Result<Vec<Member>, Error> {
    let rows: Vec<Row> = client.query("SELECT * FROM member", &[]).await?;

    rows.into_iter()
        .map(|row| -> Result<Member, Error> {
            Ok(Member {
                id: row.try_get("id")?,
                first_name: row.try_get("first_name")?,
                last_name: row.try_get("last_name")?,
                gender: row.try_get("gender")?,
                birth_date: row.try_get("birth_date")?,
                email: row.try_get("email")?,
                phone: row.try_get("phone")?,
                fft_license: row.try_get("fft_license")?,
                profile_picture: row.try_get("profile_picture")?,
                signup_date: row.try_get("signup_date")?,
            })
        })
        .collect()
}

pub async fn update_member(client: &Client, updated_member: &Member) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("UPDATE member SET first_name = $1, last_name = $2, gender = $3, birth_date = $4, email = $5, phone = $6, fft_license = $7, profile_picture = $8 WHERE id = $9").await?;

    client
        .execute(
            &stmt,
            &[
                &updated_member.first_name,
                &updated_member.last_name,
                &updated_member.gender,
                &updated_member.birth_date,
                &updated_member.email,
                &updated_member.phone,
                &updated_member.fft_license,
                &updated_member.profile_picture,
                &updated_member.id,
            ],
        )
        .await
}

pub async fn delete_member(client: &Client, id: Uuid) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("DELETE FROM member WHERE id = $1").await?;
    client.execute(&stmt, &[&id]).await
}

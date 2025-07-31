use crate::db::models::Member;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn add_member(client: &Client, member: &Member) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO members (first_name, last_name, gender, birth_date, email, phone, fft_license, profile_picture) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id")
        .await?;

    let fft_license: &Option<String> = match member.fft_license {
        Some(ref s) if s.is_empty() => &None,
        _ => &member.fft_license,
    };
    let profile_picture: &Option<String> = match member.profile_picture {
        Some(ref s) if s.is_empty() => &None,
        _ => &member.profile_picture,
    };

    let rows: Vec<Row> = client
        .query(
            &stmt,
            &[
                &member.first_name,
                &member.last_name,
                &member.gender,
                &member.birth_date,
                &member.email,
                &member.phone,
                fft_license,
                profile_picture,
            ],
        )
        .await?;

    rows[0].try_get("id")
}

pub async fn get_member(client: &Client, id: Uuid) -> Result<Member, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM members WHERE id = $1")
        .await?;

    let rows: Vec<Row> = client.query(&stmt, &[&id]).await?;

    Ok(Member {
        id: rows[0].try_get("id")?,
        first_name: rows[0].try_get("first_name")?,
        last_name: rows[0].try_get("last_name")?,
        gender: rows[0].try_get("gender")?,
        birth_date: rows[0].try_get("birth_date")?,
        email: rows[0].try_get("email")?,
        phone: rows[0].try_get("phone")?,
        fft_license: rows[0].try_get("fft_license")?,
        profile_picture: rows[0].try_get("profile_picture")?,
        signup_date: rows[0].try_get("signup_date")?,
    })
}

pub async fn delete_member(client: &Client, id: Uuid) -> Result<u64, Error> {
    let stmt: Statement = client.prepare("DELETE FROM members WHERE id = $1").await?;
    client.execute(&stmt, &[&id]).await
}

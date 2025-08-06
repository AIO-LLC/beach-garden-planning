use crate::db::models::AuthData;
use tokio_postgres::{Client, Error, Row, Statement};

pub async fn add_auth_data(client: &Client, auth_data: &AuthData) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare(
            "INSERT INTO auth_data (email, code_hash, expires_at) VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE
             SET code_hash = $2, expires_at = $3",
        )
        .await?;

    client
        .execute(
            &stmt,
            &[
                &auth_data.email,
                &auth_data.code_hash,
                &auth_data.expires_at,
            ],
        )
        .await
}

pub async fn get_auth_data(client: &Client, email: &String) -> Result<AuthData, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM auth_data WHERE email = $1")
        .await?;
    let row: Row = client.query_one(&stmt, &[email]).await?;

    Ok(AuthData {
        email: row.try_get("email")?,
        code_hash: row.try_get("code_hash")?,
        expires_at: row.try_get("expires_at")?,
    })
}

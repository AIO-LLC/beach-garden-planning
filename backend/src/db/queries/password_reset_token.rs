use crate::db::models::PasswordResetToken;
use tokio_postgres::{Client, Error, Row, Statement};
use uuid::Uuid;

pub async fn create_token(client: &Client, member_id: &str) -> Result<Uuid, Error> {
    let stmt: Statement = client
        .prepare("INSERT INTO password_reset_token (member_id) VALUES ($1) RETURNING token")
        .await?;

    let row: Row = client.query_one(&stmt, &[&member_id]).await?;

    let token: Uuid = row.try_get("token")?;
    Ok(token)
}

pub async fn get_token_info(client: &Client, token: &Uuid) -> Result<PasswordResetToken, Error> {
    let stmt: Statement = client
        .prepare("SELECT * FROM password_reset_token WHERE token=$1")
        .await?;

    let row: Row = client.query_one(&stmt, &[&token]).await?;

    let token_info = PasswordResetToken {
        token: row.try_get("token")?,
        member_id: row.try_get("member_id")?,
        expires_at: row.try_get("expires_at")?,
    };

    Ok(token_info)
}

pub async fn delete_token(client: &Client, token: &Uuid) -> Result<u64, Error> {
    let stmt: Statement = client
        .prepare("DELETE FROM password_reset_token WHERE token=$1")
        .await?;
    client.execute(&stmt, &[&token]).await
}

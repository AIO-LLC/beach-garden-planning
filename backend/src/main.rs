use chrono::NaiveDateTime;
use dotenvy::dotenv;
use std::env;
use tokio_postgres::{Error, NoTls};

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();

    let postgres_user =
        env::var("POSTGRES_USER").expect("POSTGRES_USER must be set in environment variables.");
    let postgres_db =
        env::var("POSTGRES_DB").expect("POSTGRES_DB must be set in environment variables.");
    let postgres_password = env::var("POSTGRES_PASSWORD")
        .expect("POSTGRES_PASSWORD must be set in environment variables.");
    let postgres_port =
        env::var("POSTGRES_PORT").expect("POSTGRES_PORT must be set in environment variables.");

    // Connect ---------------------------------------------------------------
    let (client, connection) = tokio_postgres::connect(
        &format!(
            "host=localhost port={postgres_port} user={postgres_user} dbname={postgres_db} password={postgres_password}"
        ),
        NoTls,
    )
    .await?;

    // Spawn the background task that runs the connection
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    // Prepare data ----------------------------------------------------------
    let name = "LaunchParty";
    let ts: NaiveDateTime = chrono::Local::now().naive_local();

    // Insert and get the ID back in one operation --------------------------
    let row = client
        .query_one(
            "INSERT INTO events (name, date_time) VALUES ($1, $2) RETURNING id",
            &[&name, &ts],
        )
        .await?;

    let new_id: i32 = row.get(0);
    println!("Inserted row id={}", new_id);

    Ok(())
}

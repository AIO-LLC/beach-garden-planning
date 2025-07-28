use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
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
            eprintln!("connection error: {e}");
        }
    });

    // Prepare data ----------------------------------------------------------
    let name = "Tournament";
    let now = chrono::Local::now().naive_local();

    // Separate the date and time components
    let date: NaiveDate = now.date();
    let time: NaiveTime = now.time();

    // Insert with separate date and time columns ----------------------------
    let row = client
        .query_one(
            "INSERT INTO events (name, date, time) VALUES ($1, $2, $3) RETURNING id",
            &[&name, &date, &time],
        )
        .await?;

    let new_id: i32 = row.get(0);
    println!("Inserted row id={new_id}");

    // Query the inserted data -----------------------------------------------
    let event = client
        .query_one("SELECT * FROM events WHERE id = ($1)", &[&new_id])
        .await?;

    let retrieved_name: String = event.get(1);
    let retrieved_date: NaiveDate = event.get(2);
    let retrieved_time: NaiveTime = event.get(3);

    println!("Name: {retrieved_name}, Date: {retrieved_date}, Time: {retrieved_time}");

    // If you need to reconstruct a NaiveDateTime from the separate components
    let reconstructed_datetime = NaiveDateTime::new(retrieved_date, retrieved_time);
    println!("Reconstructed datetime: {reconstructed_datetime}");

    Ok(())
}

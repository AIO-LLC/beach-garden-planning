mod db;

use chrono::{NaiveDate, NaiveTime};
use tokio_postgres::Error;

use crate::db::connection::connect_to_db;
use crate::db::queries::insert_into_events;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let (client, connection) = connect_to_db().await;

    // Spawn the background task that runs the connection
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {e}");
        }
    });

    // Prepare data ----------------------------------------------------------
    let name = "Training";
    let now = chrono::Local::now().naive_local();

    // Separate the date and time components
    let date: NaiveDate = now.date();
    let time: NaiveTime = now.time();

    // Insert with separate date and time columns ----------------------------
    let new_id: i32 = insert_into_events(&client, name, date, time).await;

    // Query the inserted data -----------------------------------------------
    let event = client
        .query_one("SELECT * FROM events WHERE id = ($1)", &[&new_id])
        .await?;

    let retrieved_name: String = event.get(1);
    let retrieved_date: NaiveDate = event.get(2);
    let retrieved_time: NaiveTime = event.get(3);

    println!("Name: {retrieved_name}, Date: {retrieved_date}, Time: {retrieved_time}");

    Ok(())
}

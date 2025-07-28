use dotenvy::dotenv;
use std::env;
use tokio_postgres::{tls::NoTlsStream, Client, Connection, NoTls, Socket};

fn build_connection_str() -> String {
    dotenv().ok();

    let postgres_user: String =
        env::var("POSTGRES_USER").expect("Undefined POSTGRES_USER environment variable");
    let postgres_db: String =
        env::var("POSTGRES_DB").expect("Undefined POSTGRES_DB environment variable");
    let postgres_password: String =
        env::var("POSTGRES_PASSWORD").expect("Undefined POSTGRES_PASSWORD environment variable");
    let postgres_port: String =
        env::var("POSTGRES_PORT").expect("Undefined POSTGRES_PORT environment variable");

    format!(
        "host=localhost port={postgres_port} user={postgres_user} dbname={postgres_db} password={postgres_password}"
    )
}

pub async fn connect_to_db() -> (Client, Connection<Socket, NoTlsStream>) {
    tokio_postgres::connect(&build_connection_str(), NoTls)
        .await
        .expect("Couldn't connect to database")
}

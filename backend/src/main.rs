mod api;
mod db;

use axum::{Error, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let app: Router = api::app::router().await;

    let addr: SocketAddr = "0.0.0.0:8080".parse().expect("");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Listening on {addr}");

    axum::serve(listener, app).await.unwrap();
    Ok(())
}

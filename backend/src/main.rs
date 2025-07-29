mod db;
mod rest;

use axum::{
    routing::{delete, get, post},
    Error, Router,
};
use rest::build_state;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let state = build_state().await;

    let app = Router::new()
        .route("/events", post(rest::insert_into_events))
        .route(
            "/events/{data}",
            get(rest::get_day_events).delete(rest::delete_event),
        )
        .with_state(state);

    let addr: SocketAddr = "0.0.0.0:8080".parse().expect("");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Listening on {addr}");
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

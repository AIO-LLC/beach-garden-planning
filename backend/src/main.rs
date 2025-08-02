use backend::api::app::{build_state, router, AppState};
use axum::{Error, Router};
use dotenvy::dotenv;
use std::env;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();

    let api_port: u16 =
        str::parse(&env::var("API_PORT").expect("Undefined API_PORT environment variable"))
            .unwrap();

    let app_state: AppState = build_state().await;
    let app: Router = router(app_state).await;

    let addr: SocketAddr = format!("0.0.0.0:{api_port}").parse().expect("");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Listening on {addr}");

    axum::serve(listener, app).await.unwrap();
    Ok(())
}

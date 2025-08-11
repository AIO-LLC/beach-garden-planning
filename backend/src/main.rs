use axum::{Error, Router};
use backend::api::app::{AppState, build_state, router};
use dotenvy::dotenv;
use std::env;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();

    let api_ip: &str = &env::var("API_IP").expect("Undefined API_IP environment variable");
    let api_port: u16 =
        str::parse(&env::var("API_PORT").expect("Undefined API_PORT environment variable"))
            .unwrap();

    let app_state: AppState = build_state().await;
    let app: Router = router(app_state).await;

    let addr: SocketAddr = format!("{api_ip}:{api_port}").parse().expect("");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Listening on {addr}");

    axum::serve(listener, app).await.unwrap();
    Ok(())
}

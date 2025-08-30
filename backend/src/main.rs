use backend::api::app::{AppState, build_state, router};
use lambda_http::Error;

#[cfg(feature = "local")]
use {
    dotenvy::dotenv,
    std::{env, net::SocketAddr},
};

#[cfg(not(feature = "local"))]
use lambda_http::run;

#[tokio::main]
async fn main() -> Result<(), Error> {
    #[cfg(feature = "local")]
    {
        dotenv().ok();

        let api_ip: &str = &env::var("API_IP").expect("Undefined API_IP environment variable");
        let api_port: u16 =
            str::parse(&env::var("API_PORT").expect("Undefined API_PORT environment variable"))
                .unwrap();

        let app_state: AppState = build_state().await;
        let app = router(app_state).await;
        let addr: SocketAddr = format!("{api_ip}:{api_port}").parse().expect("");
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        println!("Listening on {addr}");

        axum::serve(listener, app).await.unwrap();
    }

    #[cfg(not(feature = "local"))]
    {
        let app_state: AppState = build_state().await;
        let app = router(app_state).await;
        run(app).await?;
    }

    Ok(())
}

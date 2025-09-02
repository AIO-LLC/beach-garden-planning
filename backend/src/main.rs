use backend::api::app::{AppState, build_state, router};
use lambda_http::Error;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[cfg(feature = "local")]
use {
    dotenvy::dotenv,
    std::{env, net::SocketAddr},
};

#[cfg(not(feature = "local"))]
use lambda_http::run;

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize tracing for both local and production
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                // Default to info level, but show debug for backend modules
                "info,backend=debug,tower_http=debug".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    #[cfg(feature = "local")]
    {
        dotenv().ok();

        tracing::info!("Starting backend in local mode");

        let api_ip: &str = &env::var("API_IP").expect("Undefined API_IP environment variable");
        let api_port: u16 =
            str::parse(&env::var("API_PORT").expect("Undefined API_PORT environment variable"))
                .unwrap();

        let app_state: AppState = build_state().await;
        let app = router(app_state).await;
        let addr: SocketAddr = format!("{api_ip}:{api_port}")
            .parse()
            .expect("Invalid address");
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

        tracing::info!("Listening on {}", addr);

        axum::serve(listener, app).await.unwrap();
    }

    #[cfg(not(feature = "local"))]
    {
        tracing::info!("Starting backend in production mode");

        let app_state: AppState = build_state().await;
        let app = router(app_state).await;
        run(app).await?;
    }

    Ok(())
}

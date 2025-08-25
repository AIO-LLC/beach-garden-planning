use anyhow::Error;
use axum::Router;
use axum_test::{TestResponse, TestServer};
use backend::api::app::{AppState, router};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use serde_json::json;
use testcontainers::GenericImage;
use testcontainers::core::{IntoContainerPort, WaitFor};
use testcontainers_modules::testcontainers::{ContainerAsync, runners::AsyncRunner};
use tokio_postgres::NoTls;

pub async fn create_test_server() -> Result<(TestServer, Pool, ContainerAsync<GenericImage>), Error>
{
    let container = GenericImage::new("postgres-with-pgcron", "latest")
        .with_exposed_port(5432.tcp())
        .with_wait_for(WaitFor::message_on_stderr(
            "database system is ready to accept connections",
        ))
        .start()
        .await?;

    let container_port = container.get_host_port_ipv4(5432).await?;

    let mut cfg = Config::new();
    cfg.host = Some("localhost".into());
    cfg.user = Some("postgres".into());
    cfg.dbname = Some("postgres".into());
    cfg.password = Some("postgres".into());
    cfg.port = Some(container_port);
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });

    let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls)?;
    let app_state = AppState { pool: pool.clone() };
    let app: Router = router(app_state).await;

    let server = TestServer::new(app)?;

    Ok((server, pool, container))
}

pub async fn add_member_request(server: &TestServer) -> Result<TestResponse, anyhow::Error> {
    let new_member = json!({
        "id": "AB1234",
        "phone": "0123456789",
        "password": "",
        "email": "john.doe@email.com",
        "first_name": "John",
        "last_name": "Doe",
    });
    Ok(server.post("/member").json(&new_member).await)
}

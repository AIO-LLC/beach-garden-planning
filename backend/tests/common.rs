use axum::Router;
use axum_test::TestServer;
use backend::api::app::{router, AppState};
use testcontainers_modules::postgres::Postgres;
use testcontainers_modules::testcontainers::{runners::AsyncRunner, ContainerAsync};
use deadpool_postgres::{Config, ManagerConfig, RecyclingMethod, Runtime};
use tokio_postgres::NoTls;
use anyhow::Error;

pub async fn create_test_server() -> Result<(TestServer, ContainerAsync<Postgres>), Error> {
    let container = Postgres::default()
        .with_init_sql(include_str!("../db/init.sql").to_string().into_bytes())
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
    let app_state = AppState { pool };
    let app: Router = router(app_state).await;

    let server = TestServer::new(app)?;
    
    Ok((server, container))
}

mod common;
use crate::common::add_member_request;
use axum_test::{TestResponse, TestServer};
use backend::db::{models::Reservation, queries};
use chrono::NaiveDate;
use common::create_test_server;
use deadpool_postgres::{Client, Pool};
use serde_json::json;
use testcontainers::ContainerAsync;
use testcontainers_modules::postgres::Postgres;

async fn add_reservation_request(server: &TestServer) -> Result<TestResponse, anyhow::Error> {
    add_member_request(server).await?; // Necessary since the member ID is a foreign key in reservation

    let new_reservation = json!({
        "id": "CD5678",
        "member_id": "AB1234",
        "court_number": 1,
        "reservation_date": "2025-08-07",
        "reservation_time": 17
    });
    Ok(server.post("/reservation").json(&new_reservation).await)
}

#[tokio::test]
async fn add_reservation() -> Result<(), anyhow::Error> {
    let (server, pool, _container): (TestServer, Pool, ContainerAsync<Postgres>) =
        create_test_server().await?;

    let add_reservation_res: TestResponse = add_reservation_request(&server).await?;
    add_reservation_res.assert_status_ok();
    let reservation_id: String = add_reservation_res.json();

    let client: Client = pool.get().await?;
    let reservation_from_db: Reservation =
        queries::reservation::get_reservation(&client, &reservation_id).await?;

    assert_eq!(reservation_from_db.id, "CD5678");
    assert_eq!(reservation_from_db.member_id, "AB1234");
    assert_eq!(reservation_from_db.court_number, 1);
    assert_eq!(
        reservation_from_db.reservation_date,
        NaiveDate::from_ymd_opt(2025, 8, 7).expect("Could not create date.")
    );
    assert_eq!(reservation_from_db.reservation_time, 17);

    Ok(())
}

#[tokio::test]
async fn get_reservation() -> Result<(), anyhow::Error> {
    let (server, _pool, _container): (TestServer, Pool, ContainerAsync<Postgres>) =
        create_test_server().await?;

    let add_reservation_res: TestResponse = add_reservation_request(&server).await?;
    let reservation_id: String = add_reservation_res.json();

    let get_reservation_res: TestResponse =
        server.get(&format!("/reservation/{reservation_id}")).await;
    get_reservation_res.assert_status_ok();
    let reservation_from_server: Reservation = get_reservation_res.json();

    assert_eq!(reservation_from_server.id, "CD5678");
    assert_eq!(reservation_from_server.member_id, "AB1234");
    assert_eq!(reservation_from_server.court_number, 1);
    assert_eq!(
        reservation_from_server.reservation_date,
        NaiveDate::from_ymd_opt(2025, 8, 7).expect("Could not create date.")
    );
    assert_eq!(reservation_from_server.reservation_time, 17);

    Ok(())
}

#[tokio::test]
async fn delete_reservation() -> Result<(), anyhow::Error> {
    let (server, pool, _container): (TestServer, Pool, ContainerAsync<Postgres>) =
        create_test_server().await?;

    let add_reservation_res: TestResponse = add_reservation_request(&server).await?;
    let reservation_id: String = add_reservation_res.json();

    let delete_reservation_res: TestResponse = server
        .delete(&format!("/reservation/{reservation_id}"))
        .await;
    delete_reservation_res.assert_status_ok();

    let get_reservation_res: TestResponse =
        server.get(&format!("/reservation/{reservation_id}")).await;
    get_reservation_res.assert_status_not_found();

    let client: Client = pool.get().await?;
    let reservation_from_db: Result<Reservation, tokio_postgres::Error> =
        queries::reservation::get_reservation(&client, &reservation_id).await;

    assert!(reservation_from_db.is_err());

    Ok(())
}

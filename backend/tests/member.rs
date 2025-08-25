mod common;

use axum_test::{TestResponse, TestServer};
use backend::{
    db::{models::Member, queries},
    utils::{hash_password, is_valid_argon2id},
};
use common::{add_member_request, create_test_server};
use deadpool_postgres::{Client, Pool};
use serde::Deserialize;
use serde_json::json;
use testcontainers::{ContainerAsync, GenericImage};

#[derive(Deserialize)]
struct AddMemberResponse {
    member_id: String,
    otp: String,
}

#[tokio::test]
async fn add_member() -> Result<(), anyhow::Error> {
    let (server, pool, _container): (TestServer, Pool, ContainerAsync<GenericImage>) =
        create_test_server().await?;

    let add_member_res: TestResponse = add_member_request(&server).await?;
    add_member_res.assert_status_ok();
    let response_body: AddMemberResponse = add_member_res.json();
    let member_id: String = response_body.member_id;
    assert_eq!(response_body.otp.len(), 6);

    let client: Client = pool.get().await?;
    let member_from_db: Member = queries::member::get_member(&client, &member_id).await?;

    assert_eq!(member_from_db.id, "AB1234");
    assert_eq!(member_from_db.phone, "0123456789");
    assert!(is_valid_argon2id(&member_from_db.password));
    assert_eq!(member_from_db.email, Some("john.doe@email.com".to_string()));
    assert_eq!(member_from_db.first_name, Some("John".to_string()));
    assert_eq!(member_from_db.last_name, Some("Doe".to_string()));
    assert!(!member_from_db.is_admin);

    Ok(())
}

#[tokio::test]
async fn get_member() -> Result<(), anyhow::Error> {
    let (server, _pool, _container): (TestServer, Pool, ContainerAsync<GenericImage>) =
        create_test_server().await?;

    let add_member_res: TestResponse = add_member_request(&server).await?;
    let response_body: AddMemberResponse = add_member_res.json();
    let member_id: String = response_body.member_id;

    let get_member_res: TestResponse = server.get(&format!("/member/{member_id}")).await;
    get_member_res.assert_status_ok();
    let member_from_server: Member = get_member_res.json();

    assert_eq!(member_from_server.id, "AB1234");
    assert_eq!(member_from_server.phone, "0123456789");
    assert!(is_valid_argon2id(&member_from_server.password));
    assert_eq!(
        member_from_server.email,
        Some("john.doe@email.com".to_string())
    );
    assert_eq!(member_from_server.first_name, Some("John".to_string()));
    assert_eq!(member_from_server.last_name, Some("Doe".to_string()));
    assert!(!member_from_server.is_admin);

    Ok(())
}

#[tokio::test]
async fn update_member() -> Result<(), anyhow::Error> {
    let (server, pool, _container): (TestServer, Pool, ContainerAsync<GenericImage>) =
        create_test_server().await?;

    let add_member_res: TestResponse = add_member_request(&server).await?;
    let response_body: AddMemberResponse = add_member_res.json();
    let member_id: String = response_body.member_id;

    let new_hashed_password: String =
        hash_password(&"password".to_string()).expect("Could not hash password.");
    let updated_member = json!({
        "id": "AB1234",
        "phone": "9876543210",
        "password": new_hashed_password,
        "email": "jane.does@email.com",
        "first_name": "Jane",
        "last_name": "Does",
    });

    let update_member_res = server
        .patch("/member-with-password")
        .json(&updated_member)
        .await;
    update_member_res.assert_status_ok();

    let client: Client = pool.get().await?;
    let member_from_db: Member = queries::member::get_member(&client, &member_id).await?;

    assert_eq!(member_from_db.id, "AB1234");
    assert_eq!(member_from_db.phone, "9876543210");
    assert!(is_valid_argon2id(&member_from_db.password));
    assert_eq!(
        member_from_db.email,
        Some("jane.does@email.com".to_string())
    );
    assert_eq!(member_from_db.first_name, Some("Jane".to_string()));
    assert_eq!(member_from_db.last_name, Some("Does".to_string()));
    assert!(!member_from_db.is_admin);

    Ok(())
}

#[tokio::test]
async fn delete_member() -> Result<(), anyhow::Error> {
    let (server, pool, _container): (TestServer, Pool, ContainerAsync<GenericImage>) =
        create_test_server().await?;

    let add_member_res: TestResponse = add_member_request(&server).await?;
    let response_body: AddMemberResponse = add_member_res.json();
    let member_id: String = response_body.member_id;

    let delete_member_res: TestResponse = server.delete(&format!("/member/{member_id}")).await;
    delete_member_res.assert_status_ok();

    let get_member_res: TestResponse = server.get(&format!("/member/{member_id}")).await;
    get_member_res.assert_status_not_found();

    let client: Client = pool.get().await?;
    let member_from_db: Result<Member, tokio_postgres::Error> =
        queries::member::get_member(&client, &member_id).await;

    assert!(member_from_db.is_err());

    Ok(())
}

mod common;
use anyhow::Error;
use axum_test::TestServer;
use backend::db::models::Member;
use serde_json::json;
use common::create_test_server;
use testcontainers::ContainerAsync;
use testcontainers_modules::postgres::Postgres;
use uuid::Uuid;

#[tokio::test]
async fn member_lifecycle() -> Result<(), Error> {
    let (server, _container): (TestServer, ContainerAsync<Postgres>) = create_test_server().await?;

    // Test POST /member -------------------------------------------------------
    let new_member = json!({
        "id": "",
        "first_name": "John",
        "last_name": "Doe",
        "gender": "M",
        "birth_date": "1990-01-01",
        "email": "john.doe@email.com",
        "phone": "1123456789",
        "fft_license": "",
        "profile_picture": ""
    });

    let post_response = server.post("/member")
        .json(&new_member)
        .await;

    post_response.assert_status_ok();
    let member1_id: String = post_response.json();

    // Test GET /member/{id} ---------------------------------------------------
    let get_response = server.get(&format!("/member/{member1_id}")).await;
    get_response.assert_status_ok();

    let member1: Member = get_response.json();

    assert_eq!(member1.id, Some(Uuid::parse_str(&member1_id).unwrap()));
    assert_eq!(member1.first_name, "John");
    assert_eq!(member1.last_name, "Doe");
    assert_eq!(member1.gender, "M");
    assert_eq!(member1.birth_date.to_string(), "1990-01-01");
    assert_eq!(member1.email, "john.doe@email.com");
    assert_eq!(member1.phone, "1123456789");
    assert!(member1.fft_license.is_none());
    assert!(member1.profile_picture.is_none());

    // Test PATCH /member ------------------------------------------------------
    let updated_member = json!({
        "id": member1_id,
        "first_name": "Jane",
        "last_name": "Doe",
        "gender": "F",
        "birth_date": "1991-01-01",
        "email": "jane.doe@email.com",
        "phone": "1987654321",
        "fft_license": "F1234567",
        "profile_picture": "pp.png"
    });

    let patch_response = server.patch("/member")
        .json(&updated_member)
        .await;
    patch_response.assert_status_ok();

    // Test GET /members -------------------------------------------------------
    // Add a second member to test the get all members route
    let post_response = server.post("/member")
        .json(&new_member)
        .await;

    post_response.assert_status_ok();
    let member2_id: String = post_response.json();

    let get_all_response = server.get("/members").await;
    get_all_response.assert_status_ok();

    let members: Vec<Member> = get_all_response.json();

    assert_eq!(members.len(), 2);

    assert_eq!(members[0].id, Some(Uuid::parse_str(&member1_id).unwrap()));
    assert_eq!(members[0].first_name, "Jane");
    assert_eq!(members[0].last_name, "Doe");
    assert_eq!(members[0].gender, "F");
    assert_eq!(members[0].birth_date.to_string(), "1991-01-01");
    assert_eq!(members[0].email, "jane.doe@email.com");
    assert_eq!(members[0].phone, "1987654321");
    assert_eq!(members[0].fft_license, Some("F1234567".to_string()));
    assert_eq!(members[0].profile_picture, Some("pp.png".to_string()));

    assert_eq!(members[1].id, Some(Uuid::parse_str(&member2_id).unwrap()));
    assert_eq!(members[1].first_name, "John");
    assert_eq!(members[1].last_name, "Doe");
    assert_eq!(members[1].gender, "M");
    assert_eq!(members[1].birth_date.to_string(), "1990-01-01");
    assert_eq!(members[1].email, "john.doe@email.com");
    assert_eq!(members[1].phone, "1123456789");
    assert!(members[1].fft_license.is_none());
    assert!(members[1].profile_picture.is_none());

    // Test DELETE /member/{id} ------------------------------------------------
    let delete_response = server.delete(&format!("/member/{member1_id}")).await;
    delete_response.assert_status_ok();

    let get_all_response = server.get("/members").await;
    get_all_response.assert_status_ok();
    let members: Vec<Member> = get_all_response.json();
    assert_eq!(members[0].id, Some(Uuid::parse_str(&member2_id).unwrap()));
    
    Ok(())
}


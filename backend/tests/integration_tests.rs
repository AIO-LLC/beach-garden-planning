mod common;
use anyhow::Error;
use axum_test::TestServer;
use backend::db::models::{Address, Member, Reservation};
use common::create_test_server;
use serde_json::json;
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

    let post_response = server.post("/member").json(&new_member).await;

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

    let patch_response = server.patch("/member").json(&updated_member).await;
    patch_response.assert_status_ok();

    // Test GET /members -------------------------------------------------------
    // Add a second member to test the get all members route
    let post_response = server.post("/member").json(&new_member).await;

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

    let get_response = server.get(&format!("/member/{member1_id}")).await;
    get_response.assert_status_not_found();

    let get_all_response = server.get("/members").await;
    get_all_response.assert_status_ok();
    let members: Vec<Member> = get_all_response.json();
    assert_eq!(members.len(), 1);
    assert_eq!(members[0].id, Some(Uuid::parse_str(&member2_id).unwrap()));

    Ok(())
}

#[tokio::test]
async fn address_lifecycle() -> Result<(), Error> {
    let (server, _container): (TestServer, ContainerAsync<Postgres>) = create_test_server().await?;

    // Test POST /address ------------------------------------------------------
    // A member must be created before creating an address
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
    let post_response = server.post("/member").json(&new_member).await;
    let member_id: String = post_response.json();

    let new_address = json!({
        "id": "",
        "member_id": member_id,
        "line_1": "123 Main St",
        "line_2": "",
        "postal_code": "12345",
        "city": "Anytown",
        "country": "United States"
    });

    let post_response = server.post("/address").json(&new_address).await;
    let address_id: String = post_response.json();
    post_response.assert_status_ok();

    // Test GET /address/{member_id} -------------------------------------------
    let get_response = server.get(&format!("/address/{member_id}")).await;
    get_response.assert_status_ok();

    let address: Address = get_response.json();

    assert_eq!(address.id, Some(Uuid::parse_str(&address_id).unwrap()));
    assert_eq!(address.member_id, Uuid::parse_str(&member_id).unwrap());
    assert_eq!(address.line_1, "123 Main St");
    assert_eq!(address.line_2, None);
    assert_eq!(address.postal_code, "12345");
    assert_eq!(address.city, "Anytown");
    assert_eq!(address.country, "United States");

    // Test PATCH /address -----------------------------------------------------
    let updated_address = json!({
        "id": address_id,
        "member_id": member_id,
        "line_1": "234 Develop St",
        "line_2": "Apt 123",
        "postal_code": "23456",
        "city": "Bigtown",
        "country": "United Kingdom"
    });

    let patch_response = server.patch("/address").json(&updated_address).await;
    patch_response.assert_status_ok();

    let get_response = server.get(&format!("/address/{member_id}")).await;
    get_response.assert_status_ok();

    let address: Address = get_response.json();

    assert_eq!(address.id, Some(Uuid::parse_str(&address_id).unwrap()));
    assert_eq!(address.member_id, Uuid::parse_str(&member_id).unwrap());
    assert_eq!(address.line_1, "234 Develop St");
    assert_eq!(address.line_2, Some("Apt 123".to_string()));
    assert_eq!(address.postal_code, "23456");
    assert_eq!(address.city, "Bigtown");
    assert_eq!(address.country, "United Kingdom");

    // Test DELETE /member/{id} ------------------------------------------------
    // By deleting the corresponding member, it should cascade the address deletion
    let delete_response = server.delete(&format!("/member/{member_id}")).await;
    delete_response.assert_status_ok();

    let get_response = server.get(&format!("/address/{member_id}")).await;
    get_response.assert_status_not_found();

    Ok(())
}

#[tokio::test]
async fn reservation_lifecycle() -> Result<(), Error> {
    let (server, _container): (TestServer, ContainerAsync<Postgres>) = create_test_server().await?;
    let date: &str = "2026-07-14";

    // Reservations require at least one member
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
    let post_response = server.post("/member").json(&new_member).await;
    let member_id: String = post_response.json();

    // Test POST /reservation --------------------------------------------------
    let new_reservation = json!({
        "id": "",
        "court_number": 1,
        "reservation_date": date,
        "reservation_time": 15,
    });
    let post_response = server
        .post(&format!("/reservation/{member_id}"))
        .json(&new_reservation)
        .await;
    post_response.assert_status_ok();
    let reservation1_id: String = post_response.json();

    // Check if the constraint `unique_court_date_time` prevent duplicates
    let post_response = server
        .post(&format!("/reservation/{member_id}"))
        .json(&new_reservation)
        .await;
    post_response.assert_status_conflict();

    // Test GET /reservation/{reservation_id} ----------------------------------
    let get_response = server.get(&format!("/reservation/{reservation1_id}")).await;
    get_response.assert_status_ok();
    let reservation1: Reservation = get_response.json();

    assert_eq!(
        reservation1.id,
        Some(Uuid::parse_str(&reservation1_id).expect("Could not parse UUID from string."))
    );
    assert_eq!(reservation1.court_number, 1);
    assert_eq!(reservation1.reservation_date.to_string(), date);
    assert_eq!(reservation1.reservation_time, 15);

    // Check if relationship between the member and their reservation has been added to the
    // junction table
    let reservations_from_member_response = server
        .get(&format!("/reservations/member/{member_id}"))
        .await;
    reservations_from_member_response.assert_status_ok();
    let reservations_from_member: Vec<Uuid> = reservations_from_member_response.json();
    assert_eq!(reservations_from_member.len(), 1);
    assert_eq!(reservations_from_member[0].to_string(), reservation1_id);

    let members_from_reservation_response = server
        .get(&format!("/members/reservation/{reservation1_id}"))
        .await;
    members_from_reservation_response.assert_status_ok();
    let members_from_reservation: Vec<Uuid> = members_from_reservation_response.json();
    assert_eq!(members_from_reservation.len(), 1);
    assert_eq!(members_from_reservation[0].to_string(), member_id);

    // Test GET /reservations/{date} -------------------------------------------
    // Add another reservation for the same date
    let new_reservation = json!({
        "id": "",
        "court_number": 2,
        "reservation_date": date,
        "reservation_time": 16,
    });
    let post_response = server
        .post(&format!("/reservation/{member_id}"))
        .json(&new_reservation)
        .await;
    post_response.assert_status_ok();
    let reservation2_id: String = post_response.json();

    // Check if relationship between the member and their second reservation has been added to the
    // junction table
    let reservations_from_member_response = server
        .get(&format!("/reservations/member/{member_id}"))
        .await;
    reservations_from_member_response.assert_status_ok();
    let reservations_from_member: Vec<Uuid> = reservations_from_member_response.json();
    assert_eq!(reservations_from_member.len(), 2);
    assert_eq!(reservations_from_member[0].to_string(), reservation1_id);
    assert_eq!(reservations_from_member[1].to_string(), reservation2_id);

    let members_from_reservation_response = server
        .get(&format!("/members/reservation/{reservation1_id}"))
        .await;
    members_from_reservation_response.assert_status_ok();
    let members_from_reservation: Vec<Uuid> = members_from_reservation_response.json();
    assert_eq!(members_from_reservation.len(), 1);
    assert_eq!(members_from_reservation[0].to_string(), member_id);

    let members_from_reservation_response = server
        .get(&format!("/members/reservation/{reservation2_id}"))
        .await;
    members_from_reservation_response.assert_status_ok();
    let members_from_reservation: Vec<Uuid> = members_from_reservation_response.json();
    assert_eq!(members_from_reservation.len(), 1);
    assert_eq!(members_from_reservation[0].to_string(), member_id);

    let get_response = server.get(&format!("/reservations/{date}")).await;
    get_response.assert_status_ok();
    let reservations: Vec<Reservation> = get_response.json();

    assert_eq!(reservations.len(), 2);
    assert_eq!(
        reservations[0].id,
        Some(Uuid::parse_str(&reservation1_id).expect("Could not parse UUID from string."))
    );
    assert_eq!(reservations[0].court_number, 1);
    assert_eq!(reservations[0].reservation_date.to_string(), date);
    assert_eq!(reservations[0].reservation_time, 15);
    assert_eq!(
        reservations[1].id,
        Some(Uuid::parse_str(&reservation2_id).expect("Could not parse UUID from string."))
    );
    assert_eq!(reservations[1].court_number, 2);
    assert_eq!(reservations[1].reservation_date.to_string(), date);
    assert_eq!(reservations[1].reservation_time, 16);

    // Test PATCH /reservation -------------------------------------------------
    let updated_date: &str = "2026-08-15";
    let updated_reservation = json!({
        "id": reservation1_id,
        "court_number": 3,
        "reservation_date": updated_date,
        "reservation_time": 9,
    });

    let patch_response = server
        .patch("/reservation")
        .json(&updated_reservation)
        .await;
    patch_response.assert_status_ok();

    let get_response = server.get(&format!("/reservation/{reservation1_id}")).await;
    get_response.assert_status_ok();

    let reservation1: Reservation = get_response.json();

    assert_eq!(
        reservation1.id,
        Some(Uuid::parse_str(&reservation1_id).expect("Could not parse UUID from string."))
    );
    assert_eq!(reservation1.court_number, 3);
    assert_eq!(reservation1.reservation_date.to_string(), updated_date);
    assert_eq!(reservation1.reservation_time, 9);

    // Test DELETE /reservation/{id} ------------------------------------------------
    let delete_response = server
        .delete(&format!("/reservation/{reservation1_id}"))
        .await;
    delete_response.assert_status_ok();

    let get_response = server.get(&format!("/reservation/{reservation1_id}")).await;
    get_response.assert_status_not_found();

    // Check if relationship between the member and their first reservation has been deleted
    let reservations_from_member_response = server
        .get(&format!("/reservations/member/{member_id}"))
        .await;
    reservations_from_member_response.assert_status_ok();
    let reservations_from_member: Vec<Uuid> = reservations_from_member_response.json();
    assert_eq!(reservations_from_member.len(), 1);
    assert_eq!(reservations_from_member[0].to_string(), reservation2_id);

    let members_from_reservation_response = server
        .get(&format!("/members/reservation/{reservation1_id}"))
        .await;
    members_from_reservation_response.assert_status_not_found();

    // By deleting the corresponding member, it should cascade the deletion of the remaining
    // reservation
    let delete_response = server.delete(&format!("/member/{member_id}")).await;
    delete_response.assert_status_ok();

    let reservations_from_member_response = server
        .get(&format!("/reservations/member/{member_id}"))
        .await;
    reservations_from_member_response.assert_status_not_found();

    let members_from_reservation_response = server
        .get(&format!("/members/reservation/{reservation2_id}"))
        .await;
    members_from_reservation_response.assert_status_not_found();

    Ok(())
}

pub mod api {
    pub mod app;
    pub mod wrappers {
        pub mod address;
        pub mod member;
        pub mod reservation;
        pub mod reservation_to_member;
    }
}

pub mod db {
    pub mod models;
    pub mod queries {
        pub mod address;
        pub mod auth;
        pub mod member;
        pub mod reservation;
        pub mod reservation_to_member;
    }
}

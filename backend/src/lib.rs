pub mod api {
    pub mod app;
    pub mod wrappers {
        pub mod addresses;
        pub mod members;
    }
}

pub mod db {
    pub mod models;
    pub mod queries {
        pub mod addresses;
        pub mod members;
    }
}

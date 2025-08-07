CREATE TABLE member (
  id CHAR(6) PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL, -- E.164 format, digits only
  password VARCHAR(127) NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(63),
  last_name VARCHAR(63)
);

CREATE TABLE reservation (
  id CHAR(6) PRIMARY KEY,
  member_id CHAR(6) NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  court_number SMALLINT NOT NULL CHECK (court_number BETWEEN 1 AND 4),
  reservation_date DATE NOT NULL,
  reservation_time SMALLINT NOT NULL CHECK (reservation_time BETWEEN 0 AND 23), -- 24h format
  CONSTRAINT unique_court_date_time UNIQUE (court_number, reservation_date, reservation_time),
  CONSTRAINT one_reservation_per_day UNIQUE (member_id, reservation_date)
);

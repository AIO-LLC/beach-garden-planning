CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(63) NOT NULL,
  last_name VARCHAR(63) NOT NULL,
  gender CHAR(1) NOT NULL,
  birth_date DATE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL, -- E.164 format, digits only
  fft_license CHAR(8),
  profile_picture VARCHAR(255), -- S3 key
  signup_date DATE
);

CREATE TABLE address (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID UNIQUE NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  line_1 VARCHAR(127) NOT NULL,
  line_2 VARCHAR(127),
  postal_code VARCHAR(6) NOT NULL,
  city VARCHAR(63) NOT NULL,
  country VARCHAR(31) NOT NULL
);

CREATE TABLE reservation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_number SMALLINT NOT NULL CHECK (court_number BETWEEN 1 AND 4),
  reservation_date DATE NOT NULL,
  reservation_time SMALLINT NOT NULL CHECK (reservation_time BETWEEN 0 AND 23), -- 24h format
  duration SMALLINT NOT NULL DEFAULT 1 -- In hours
);

CREATE TABLE reservation_to_member (
  reservation_id UUID NOT NULL REFERENCES reservation(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  PRIMARY KEY (reservation_id, member_id)
);

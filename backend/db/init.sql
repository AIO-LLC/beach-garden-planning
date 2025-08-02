CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE members (
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

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  line_1 VARCHAR(127) NOT NULL,
  line_2 VARCHAR(127),
  postal_code VARCHAR(6) NOT NULL,
  city VARCHAR(63) NOT NULL,
  country VARCHAR(31) NOT NULL
);

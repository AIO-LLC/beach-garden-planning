CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  gender CHAR(1) NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  fft_license CHAR(8)
  signup_date DATE
);

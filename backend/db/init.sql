CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE member (
  id CHAR(6) PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL, -- E.164 format, digits only
  password VARCHAR(127) NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(63),
  last_name VARCHAR(63),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
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

CREATE TABLE password_reset_token (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id CHAR(6) NOT NULL REFERENCES member(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

-- Delete previous reservations
SELECT cron.schedule(
    'cleanup_old_reservations',
    '0 0 * * 6', -- Every Saturday at midnight
    $$DELETE FROM reservation WHERE reservation_date < CURRENT_DATE$$
);

-- Clean up expired password reset tokens
SELECT cron.schedule(
    'cleanup_expired_tokens',
    '0 0 * * 6', -- Every Saturday at midnight
    $$DELETE FROM password_reset_token WHERE expires_at < NOW()$$
);

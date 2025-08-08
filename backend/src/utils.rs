use argon2::{
    Argon2, PasswordHash,
    password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
};
use rand::distr::uniform;
use rand::seq::SliceRandom;
use rand::{Rng, distr::Uniform, prelude::Distribution, rng};

/// Generates an 8-character random string containing at least one digit and one uppercase letter.
pub fn gen_id() -> Result<String, uniform::Error> {
    let mut rng = rng();

    let digit_range: Uniform<u8> = Uniform::new_inclusive(b'0', b'9')?;
    let upper_range: Uniform<u8> = Uniform::new_inclusive(b'A', b'Z')?;

    // Guarantee one digit and one uppercase
    let mut chars: Vec<u8> = Vec::with_capacity(8);
    chars.push(digit_range.sample(&mut rng));
    chars.push(upper_range.sample(&mut rng));

    for _ in 0..4 {
        if rng.random_bool(0.5) {
            chars.push(digit_range.sample(&mut rng));
        } else {
            chars.push(upper_range.sample(&mut rng));
        }
    }

    // Shuffle to randomize positions
    chars.shuffle(&mut rng);

    // Convert to String
    Ok(chars.iter().map(|&b| b as char).collect())
}

/// Generates a random one-time password with 6 digits
pub fn gen_otp() -> Result<String, uniform::Error> {
    let size: usize = 6;
    let mut rng = rng();

    let digit_range: Uniform<u8> = Uniform::new_inclusive(b'0', b'9')?;

    let mut otp = Vec::with_capacity(size);
    for _ in 0..size {
        otp.push(digit_range.sample(&mut rng))
    }

    // Convert bytes to String
    Ok(otp.iter().map(|&b| b as char).collect())
}

pub fn hash_password(password: &String) -> Result<String, argon2::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("Could not hash password.")
        .to_string();
    Ok(hash)
}

pub fn is_valid_argon2id(hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(parsed_hash) => parsed_hash,
        Err(_) => return false,
    };

    if parsed.algorithm.as_str() != "argon2id" {
        return false;
    }

    if let Some(v) = parsed.version {
        if v.to_string() != "19" {
            return false;
        }
    }

    let has_m = parsed.params.iter().any(|(id, _)| id.as_str() == "m");
    let has_t = parsed.params.iter().any(|(id, _)| id.as_str() == "t");
    let has_p = parsed.params.iter().any(|(id, _)| id.as_str() == "p");

    has_m && has_t && has_p
}

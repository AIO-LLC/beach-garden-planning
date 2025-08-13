use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport, message::header::ContentType};

pub struct EmailService {
    transport: SmtpTransport,
    from_email: String,
}

impl EmailService {
    pub fn new(
        smtp_server: &str,
        smtp_user: &str,
        smtp_password: &str,
        from_email: String,
    ) -> Self {
        let creds = Credentials::new(smtp_user.to_string(), smtp_password.to_string());

        let transport = SmtpTransport::relay(smtp_server)
            .unwrap()
            .credentials(creds)
            .build();

        Self {
            transport,
            from_email,
        }
    }

    pub async fn send_password_reset_email(
        &self,
        to_email: &str,
        reset_token: &str,
        base_url: &str,
    ) -> Result<(), lettre::transport::smtp::Error> {
        let reset_url = format!("{}/reset-password?token={}", base_url, reset_token);

        let email_body = format!(
            r#"
            <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You have requested a password reset for your account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="{}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </body>
            </html>
            "#,
            reset_url
        );

        let email = Message::builder()
            .from(self.from_email.parse().unwrap())
            .to(to_email.parse().unwrap())
            .subject("Password Reset Request")
            .header(ContentType::TEXT_HTML)
            .body(email_body)
            .unwrap();

        self.transport.send(&email)?;
        Ok(())
    }
}

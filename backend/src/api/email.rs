use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport, message::header::ContentType};
use uuid::Uuid;

pub struct EmailService {
    transport: SmtpTransport,
    from_email: String,
}

impl EmailService {
    pub fn new(smtp_server: &str, smtp_user: &str, smtp_password: &str, from_email: &str) -> Self {
        let creds = Credentials::new(smtp_user.to_string(), smtp_password.to_string());

        let transport = SmtpTransport::relay(smtp_server)
            .unwrap()
            .credentials(creds)
            .build();

        Self {
            transport,
            from_email: from_email.to_string(),
        }
    }

    pub async fn send_password_reset_email(
        &self,
        to_email: &str,
        first_name: &str,
        reset_token: &Uuid,
        base_url: &str,
    ) -> Result<(), lettre::transport::smtp::Error> {
        let reset_url = format!("{base_url}?token={reset_token}&email={to_email}");

        let email_body = format!(
            r#"
            <html>
            <body>
                <h2>Mot de passe oublié</h2>
                <br>
                <p>Bonjour {first_name},</p>
                <br>
                <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :</p>
                <p><a href="{reset_url}">Réinitialisation de mon mot de passe</a></p>
                <p>Ce lien expirera dans une heure.</p>
                <br>
                <p>Sportivement.</p>
                <p>Beach Garden SXM</p>
            </body>
            </html>
            "#
        );

        let email = Message::builder()
            .from(self.from_email.parse().unwrap())
            .to(to_email.parse().unwrap())
            .subject("Beach Garden SXM - Mot de passe oublié")
            .header(ContentType::TEXT_HTML)
            .body(email_body)
            .unwrap();

        self.transport.send(&email)?;
        Ok(())
    }
}

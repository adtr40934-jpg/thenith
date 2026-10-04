# Thenith Backend

Express and MongoDB API for authentication, plans, subscriptions, cards, and dashboard data.

## Run

1. Create `.env` locally and set the required secrets and `MONGODB_URI`.
2. Install dependencies with `npm install`.
3. Start development mode with `npm run dev`.

## Gmail OTP

Use a Gmail App Password in `SMTP_PASSWORD`; do not use the normal Gmail password. Enable 2-Step Verification on the Google account first, create an App Password, then set `SMTP_USER` to that Gmail address and `MAIL_FROM` to the sender address (or `Thenith <sender@example.com>`). The sender display name is selected by message type, such as `Thenith OTP`, `Thenith Billing`, and `Thenith Orders`.

The API listens on `/api`. The health check is `GET /api/health`.

API documentation is available in `docs/api.md`.
Architecture details are available in `docs/architecture.md`.

# Security Baseline

## Secret Management
- **No secrets in source control**: `.env`, `*.key`, `*.pem`, and `serviceAccountKey.json` files are explicitly excluded via `.gitignore`.
- **Environment Variables**: Managed via CI/CD secrets (e.g., GitHub Secrets) for deployments. Placeholders are provided in `.env.example`.

## Firestore Security Strategy
- **Deny-by-default**: All collections have a default `allow read, write: if false;` rule.
- **Principle of Least Privilege**: Users can only modify their own designated documents.
- **Immutability**: The `audit_logs` collection cannot be written to or modified by any standard user. Backend functions or Admin SDK must be used to create logs.

## CI/CD Permissions
- Deployments are automated. Developers do not have direct push access to the Production Firebase project from their local machines.
- GitHub Actions uses scoped service account credentials stored securely.

## Third-Party Integrations
- **Stripe**: Configured to use test keys only for development. Live keys will be restricted to the Production environment.
- **Anthropic / Resend / Mixpanel**: Keys will be stored as CI/CD secrets and injected at build time.

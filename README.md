# GROUNDWORK Recruitment Command

**Milestone 1 — Environment Setup & Architecture**

GROUNDWORK is a UK football opportunity platform connecting grassroots/non-league football players and clubs, with a separate youth pathway planned for future development.

## Architecture

This project is built using:
- **Frontend**: React (Vite) + TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage, Hosting)
- **Region**: All Firebase resources must be provisioned in `europe-west2` (London)

## Firebase Environments

The project utilizes three strictly separated Firebase projects:
- **Development**: `groundwork-8ac4f`
- **Staging**: `groundwork-staging` (Pending Client Creation)
- **Production**: `groundwork-production` (Pending Client Creation)

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` or `.env.development` and fill in the required keys for the development environment.
   ```bash
   cp .env.example .env.development
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Environment Switching

Use the Firebase CLI to switch between environments for administrative tasks:

```bash
# Switch to Development
firebase use development

# Switch to Staging
firebase use staging

# Switch to Production
firebase use production
```

**Never deploy to Production directly from a local machine.**

## Deployment Flow

Deployment is managed via GitHub Actions (CI/CD):
1. **Development**: Pushing to the `develop` branch triggers deployment to the Development Firebase project.
2. **Staging**: Pushing to the `staging` branch triggers deployment to the Staging Firebase project.
3. **Production**: Merging into the `main` branch triggers deployment to the Production Firebase project. Production requires strict review.

## Security Model

- **Deny-by-default**: All Firestore and Storage reads/writes are denied unless explicitly allowed.
- **Role-based Access**: Users can only access their own data. Administrative operations require a verified admin claim.
- **Audit Logging**: All critical actions are recorded in an `audit_logs` collection, which is immutable to normal users.
- **Youth Data Separation**: Future youth profiles (`players_youth`) will remain structurally isolated from adult profiles (`players`) to ensure strict safeguarding and data protection compliance.

## Firestore Structure (Foundation)

- `/players/{userId}` - Adult player profiles (M2).
- `/players_youth/{userId}` - Youth player profiles (Future).
- `/clubs/{clubId}` - Club profiles and settings (M2).
- `/audit_logs/{logId}` - Immutable audit trails.
- `/system_config/{configId}` - Platform-wide configurations (Admin only).

## Testing

To verify the milestone foundation, run:
```bash
npm test
```
(Tests will be expanded in future milestones to cover M2 and M3 business logic).

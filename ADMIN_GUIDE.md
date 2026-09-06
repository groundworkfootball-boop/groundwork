# Platform Administration & Operational Guide

## 1. Overview
The GROUNDWORK Administration Portal (`/admin`) provides full visibility and governance across platform operations, safeguarding compliance, recruitment verification, and algorithmic integrity.

## 2. Key Administrative Modules

### 1. Club & Youth Verification (`/admin/clubs`, `/admin/youth-verification`)
- Review submitted club credentials, company numbers, and safeguarding officer certifications.
- Approve or reject adult recruitment rights (`verifiedAdult`).
- Review and approve youth recruitment clearance (`verifiedYouth`) with explicit expiry dates.
- Immediately suspend any club under investigation.

### 2. Matching Configuration (`/admin/matching`)
- Inspect current weights across the 6 scoring dimensions: Position, Distance, Level, Attributes, Availability, and Boost.
- Adjust weights with automatic validation ensuring total equals exactly 100%.
- Save creates an auditable new configuration version without corrupting historical match snapshots.

### 3. Safeguarding & Consent Audits (`/admin/consents`)
- Real-time immutable stream of guardian consent grants, re-grants, and withdrawals.
- Full verification trail of IP hashes, privacy notice versions, and timestamps.

### 4. Content Moderation & Reports (`/admin/moderation`)
- Queue of flagged player profiles, video clips, and opportunity postings.
- Actions: Investigate, Dismiss, Suspend User, or Delist Content with mandatory audit logging.

### 5. GDPR & Data Subject Rights (`/admin/gdpr`)
- Process user data export packages.
- Execute verified deletion requests with automated delisting while preserving statutory audit logs.

### 6. System Health & Infrastructure Monitoring (`/admin/health`)
- Real-time status indicators for Firebase Auth, Cloud Firestore, Firebase Storage, Stripe Gateway, and AI Provider latency.

# Firestore Schema Foundation

This document outlines the initial schema designed to support M2 and M3 features securely.

## Collections

### `/players/{userId}`
Adult non-league player profiles.
- `userId`: Matches Firebase Auth UID.
- (Fields to be defined in M2 based on specification).

### `/players_youth/{userId}` (Future)
Youth grassroots player profiles.
- Structurally separated from adult players to enforce strict safeguarding rules.

### `/clubs/{clubId}`
Club profiles.
- (Fields to be defined in M2).

### `/audit_logs/{logId}`
System-wide audit trail. Immutable by design.
- `timestamp`: Server timestamp of the action.
- `actorId`: The UID of the user performing the action.
- `action`: String describing the action (e.g., 'PROFILE_UPDATED').
- `resourceId`: The ID of the affected document.
- `resourceType`: The collection/entity type.
- `metadata`: Additional context.
- `status`: 'SUCCESS' or 'FAILURE'.

### `/system_config/{configId}`
Platform configurations manageable only by Administrators.

# Audit Logging Architecture

## Purpose
To maintain a tamper-proof, transparent record of all significant state changes within the application.

## Immutability
Audit logs are stored in the `/audit_logs` collection.
Firestore Security Rules explicitly deny any write access from client applications.
```javascript
match /audit_logs/{logId} {
  allow read: if isAdmin();
  allow write: if false; 
}
```

## How to Write Logs
Audit logs will be written exclusively by trusted server environments (e.g., Firebase Cloud Functions or an Admin API) using the Firebase Admin SDK, which bypasses security rules.

## Schema
- `timestamp`: Date/Time of the action.
- `actorId`: The UID of the user.
- `action`: E.g., 'TRIAL_INVITE_SENT'.
- `resourceId`: E.g., The Trial ID.
- `resourceType`: 'Trial'.
- `status`: 'SUCCESS'.

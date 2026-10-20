# DATA MODEL

## Collections

### Identity

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `users` | `uid` | Role, name, email, disabled flag. Server-created only. |
| `players` | `uid` | Public dossier + scoring inputs. |
| `youthProfiles` | `uid` | Guardian linkage, consent state, privacy notice version. |
| `guardians` | `uid` | Guardian identity and linked youth IDs. |

### Clubs

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `clubs` | `uid` | Public club identity, requirements, verification state. |
| `clubs/{id}/private/{doc}` | — | Private recruitment notes, staff, finance. |
| `clubVerifications` | auto | Adult verification submissions. |
| `youthVerifications` | auto | Safeguarding documentation submissions. |
| `clubInvites` | auto | Invite codes and share links. |

### Recruitment

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `opportunities` | auto | Published recruitment requests and trials. |
| `applications` | auto | Player → club applications with status. |
| `shortlists` | auto | Club-private shortlist containers. |
| `shortlistItems` | auto | Players within a shortlist. |
| `trials` | auto | Trial events, capacity, invitations. |
| `squadMembers` | auto | Club roster. |
| `squadRequirements` | auto | Structured squad needs (feeds gap analysis). |
| `conversations` | auto | Messaging threads. |
| `conversations/{id}/messages` | auto | Individual messages. |

### Matching

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `matchResults` | `{clubId}_{playerId}` | Precomputed score + breakdown + snapshot. |
| `playerScores` | `uid` | Aggregate player score inputs. |
| `matchingConfigs` | `default` | Active weights + version. |
| `matchingConfigVersions` | auto | Immutable history of every config change. |
| `matchingJobs` | auto | Recalculation queue. |

### Media

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `playerVideos` | auto | Clip metadata, processing state, AI suggestion. |
| `videoProcessingJobs` | auto | FFmpeg pipeline state. |

### Trust and compliance

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `consentAudits` | auto | Append-only consent trail. |
| `auditLogs` | auto | Append-only administrative audit trail. |
| `moderationReports` | auto | User reports and moderation state. |
| `gdprRequests` | auto | Export and deletion requests. |
| `notifications` | auto | In-app notifications. |

### Commerce

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `subscriptions` | `uid` | Stripe-authoritative subscription state. |
| `payments` | auto | Payment records. |
| `boosts` | `uid` | Visibility boost state and expiry. |
| `stripeEvents` | `eventId` | Raw webhook payloads. |
| `processedStripeEvents` | `eventId` | Idempotency ledger. |

### AI

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `aiJobs` | auto | Queued AI work. |
| `aiResults` | auto | Cached structured output. |
| `aiUsage` | auto | Per-call cost and token tracking. |
| `aiCache` | hash | Provider response cache. |

### Configuration

| Collection | Doc ID | Purpose |
| --- | --- | --- |
| `systemSettings` | key | Platform configuration. |
| `systemConfig` | key | Feature flags. |
| `analyticsEvents` | auto | Client-emitted product events. |

## Design rules

- **No giant documents.** Profile, private data, guardian data, verification
  data, media metadata, match data and audit data are separate documents.
- **Denormalised snapshots** in `matchResults` let club search filter and sort
  without reading full player documents.
- **Server-owned fields** are listed in [SECURITY.md](./SECURITY.md).
- **Append-only collections** (`consentAudits`, `auditLogs`) reject all client
  writes.

## Indexes

`firestore.indexes.json` declares 35 composite indexes covering:

- `applications`: playerId/clubId + createdAt, playerId + opportunityId, clubId + status + createdAt
- `matchResults`: playerId + matchScore, clubId + matchScore, clubId + position/ageBand/region/searchable + matchScore
- `notifications`: userId + createdAt, userId + read + createdAt
- `opportunities`: clubId + createdAt, status + createdAt
- `playerVideos`: playerId + createdAt, playerId + processingStatus, playerId + published + processingStatus
- `consentAudits`: guardianId/youthId + timestamp
- `aiResults`: ownerId + feature + contentHash
- `auditLogs`: resourceType/actorId + timestamp
- `moderationReports`, `gdprRequests`, `trials`, `squadMembers`, `shortlistItems`, `clubs`, `players`

Deploy with `firebase deploy --only firestore:indexes`.

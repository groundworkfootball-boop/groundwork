# SAFEGUARDING

Youth protection is a system-wide security requirement, not a UI feature.

## Invariants

1. A youth profile starts with `consentStatus = "pending"` and `searchable = false`.
2. It is **never** readable by a club until a guardian grants consent.
3. Even with consent, only clubs with **live, unexpired** youth verification can read it.
4. Withdrawal delists immediately and blocks AI processing.
5. Every consent action writes an immutable audit record.

## Enforcement layers

| Layer | What it checks |
| --- | --- |
| Firestore rules | `isYouth`, `consentStatus`, `searchable`, club `verifiedYouth`, `youthVerificationExpiresAt > request.time` |
| Cloud Functions | Same checks before any privileged read/write, plus consent re-check at AI enqueue and execution |
| Storage rules | Youth media requires owner, admin, or live youth-verified club |
| Custom claims | `role` is authoritative; never read from the client |

A malicious user with the Firebase SDK, DevTools and a modified client still
cannot read a pending or withdrawn youth profile — the rules evaluate the
document state server-side on every request.

## Consent lifecycle

```
pending ──grant──> granted ──withdraw──> withdrawn
   │                  │                      │
   │                  └────re-grant──────────┘
   └── profile hidden, searchable = false
```

### Grant

1. Youth registers with a guardian email.
2. `sendConsentInvite` creates a signed, time-limited token and emails the guardian.
3. Guardian opens the consent portal, reads the plain-language notice, ticks the box.
4. `grantConsent` verifies the token, sets `consentStatus = "granted"`,
   `consentGrantedAt = serverTimestamp()`, `searchable = true`.
5. An immutable `consentAudits` record is written.

### Withdraw

1. Guardian calls `withdrawConsent`.
2. `consentStatus = "withdrawn"`, `searchable = false`.
3. Match results for the youth are invalidated and the profile disappears from
   club search on the next recalculation.
4. Queued AI jobs are cancelled (`onConsentWithdrawnCancelJobs`).
5. Associated videos are queued for deletion.
6. An immutable audit record is written.

## Consent audit record

`consentAudits/{id}` — append-only, immutable to all clients.

```ts
{
  youthId, guardianId,
  action: 'granted' | 'withdrawn' | 're-granted',
  timestamp,
  hashedIp,               // SHA-256, never the raw address
  privacyNoticeVersion,
  userAgentHash,
  source
}
```

Only a statutory-retention administrative process may remove these records.

## AI and youth data

Youth data is never sent to an AI provider unless `consentStatus === "granted"`.
This is checked:

- before enqueueing the job,
- when the worker picks it up,
- immediately before the provider request.

If consent is withdrawn while a job is queued, the job is skipped. Guardian
contact details are never included in AI prompts.

## Club youth verification

- Requires approved adult verification first.
- Requires safeguarding documentation review by a safeguarding admin.
- Grants a 12-month expiry (`youthVerificationExpiresAt`).
- Expiry is evaluated on every read — an expired club loses access automatically.
- Every decision is audited (`club_verification_approved` / `_rejected`).

## Tests

`firestore.test.ts` covers:

- unverified club cannot read consented youth
- expired verification cannot read consented youth
- live-verified club can read consented, searchable youth
- pending and withdrawn consent block access even for verified clubs
- guardian can read their own youth; unrelated guardian cannot
- a player cannot self-grant consent or self-set `searchable`
- a club cannot self-verify

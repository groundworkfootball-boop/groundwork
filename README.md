# GROUNDWORK

Deterministic football recruitment for players, guardians and clubs.

Groundwork connects grassroots, Sunday league and academy talent with non-league,
semi-pro and professional clubs through a transparent, rule-based compatibility
engine — not guesswork, and never AI scoring.

---

## Two separate intelligence systems

| System | Responsibility | Can it be influenced by AI? |
| --- | --- | --- |
| **Deterministic matching** | Player–club score, search ranking, score breakdown | **No.** Pure function, no randomness, no time dependence. |
| **AI assistance** | Video descriptions, squad gap notes, profile tips | Advisory only. No write access to scores, rankings or weights. |

The two systems never share a code path. `functions/src/matching/` has no AI
imports, and `functions/src/ai/` has no write access to `matchResults` or
`playerScores` (enforced by Firestore rules).

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, React Router 7, Tailwind CSS 4
- **Backend** — Firebase Auth, Firestore, Storage, Cloud Functions (v2), Hosting
- **AI** — provider abstraction over Claude / OpenRouter, server-side only
- **Payments** — Stripe Checkout + Billing Portal, idempotent webhooks
- **Video** — FFmpeg pipeline (Cloud Run worker), server-validated uploads

---

## Quick start

```bash
# 1. Install
npm install
cd functions && npm install && cd ..

# 2. Configure
cp .env.example .env          # fill in your Firebase web credentials
cp functions/.env.example functions/.env

# 3. Run against emulators
npm run dev                   # http://localhost:5173
```

### Deploy

```bash
firebase login
firebase use groundwork-8ac4f

# Rules + indexes first
firebase deploy --only firestore:rules,firestore:indexes,storage

# Functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# Hosting
npm run build
firebase deploy --only hosting
```

> **Composite indexes are required.** `firestore.indexes.json` contains every
> index the app queries. Until they finish building, the client falls back to a
> bounded unordered query with an in-memory sort (see
> `src/lib/firestoreQuery.ts`) so the UI never breaks — but deploy the indexes
> for production performance.

---

## Project layout

```
src/
  app/            shared types
  components/
    ui/           design-system primitives (Button, Card, Badge, Modal, …)
    illustrations/ hand-authored SVG artwork
    layout/       DashboardShell, AuthLayout
  context/        AuthContext (custom-claims authoritative)
  lib/
    firebase.ts   client SDK init
    firestoreQuery.ts  index-missing fallback helper
    services/     player, club, guardian, matching, video, admin
  pages/          public, auth, player, guardian, club, admin
functions/src/
  auth/           registration, claims
  players/        profile updates + completeness
  clubs/          verification, admin review
  matching/       deterministic engine, config versions, recalculation
  safeguarding/   consent grant/withdraw + audit
  videos/         upload initiation, processing, moderation
  ai/             provider abstraction, tagging, gaps, recommendations
  payments/       checkout, webhook
  notifications/  triggers
  admin/          player visibility
  shared/         authz, audit, validation, types
```

---

## Security model

- **Custom claims are authoritative** for role. The `users/{uid}.role` document
  field is never trusted for authorization.
- **Server-owned fields** — `searchable`, `consentStatus`, `profileCompleteness`,
  `verificationStatus`, `verifiedAdult`, `verifiedYouth`, `matchScore`,
  subscription and payment state — are rejected by Firestore rules when written
  by a client.
- **Youth safeguarding** is enforced in rules *and* functions: a youth profile is
  readable only when consent is granted, the profile is searchable, and the
  club's youth verification is live and unexpired.
- **Audit and consent trails** are append-only and immutable to clients.

See [SECURITY.md](./SECURITY.md) and [SAFEGUARDING.md](./SAFEGUARDING.md).

---

## Testing

```bash
npm run lint                                   # oxlint
npx tsc -b                                     # typecheck
npx vitest run src/lib/*.test.ts               # unit tests (28)
npx firebase emulators:exec --only firestore \
  "npx vitest run firestore.test.ts"           # rules tests (33)
npm run build                                  # production build
```

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- [DATA_MODEL.md](./DATA_MODEL.md) — Firestore collections
- [MATCHING_ENGINE.md](./MATCHING_ENGINE.md) — scoring specification
- [SAFEGUARDING.md](./SAFEGUARDING.md) — youth protection model
- [SECURITY.md](./SECURITY.md) — threat model and controls
- [AI.md](./AI.md) — provider abstraction and guardrails
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — project configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) — release process
- [TESTING.md](./TESTING.md) — test strategy
- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) — operations runbook

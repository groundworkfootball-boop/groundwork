# GROUNDWORK Production Deployment Guide

## 1. Prerequisites
- Node.js 20+ (LTS) or 24+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Project with Billing Enabled

## 2. Environment Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd groundwork
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in `.env.production`:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=groundwork-production.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=groundwork-production
   VITE_FIREBASE_STORAGE_BUCKET=groundwork-production.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## 3. Deployment Steps
```bash
# 1. Type-check application
npm run build

# 2. Login to Firebase
firebase login

# 3. Select target project
firebase use production

# 4. Deploy rules and indexes first
firebase deploy --only firestore:rules,firestore:indexes,storage

# 5. Deploy Cloud Functions
firebase deploy --only functions

# 6. Deploy Frontend Application to Firebase Hosting
firebase deploy --only hosting
```

## 4. Post-Deployment Verification
1. Visit production URL (e.g. `https://groundwork-production.web.app`).
2. Log into Admin account to verify `matchingConfigs/default` initial weights are deployed.
3. Test club code generation and multi-platform sharing links.
4. Verify youth registration correctly flags minor status and requires guardian consent.

## 5. "Missing or insufficient permissions" — deployment-order check

If a dashboard shows **"Missing or insufficient permissions"** while the local
`firestore.rules` clearly allow the operation, the **deployed ruleset is older
than the client build**. Firestore rules are versioned separately from the app:
pushing new frontend code does not update them.

Confirm and fix:

```bash
firebase login
firebase use <project-id>          # e.g. groundwork-8ac4f
npm run deploy:rules               # firestore rules + indexes + storage
firebase deploy --only functions   # custom claims, callables, webhooks
```

Why both steps: several reads depend on `request.auth.token.role`, which is only
present once Cloud Functions have set custom claims. If functions are not
deployed the token has no `role` claim and role-scoped reads fall back to
document lookups — so deploy rules **and** functions together.

Which panels are affected:

| Symptom | Collection | Likely cause |
| --- | --- | --- |
| Guardian dashboard cannot list youth | `players` (`guardianEmail`) | rules predate the guardian read rule |
| Club dashboard cannot list matches | `matchResults` | rules predate the club read rule |
| Subscription / boost checkout 403 | `subscriptionRequests`, `boostRequests` | rules predate the request queues |
| Admin consoles refuse every read | `auditLogs`, `admin` claims | functions not deployed → no `role` claim |

The UI degrades instead of blanking: the affected panel shows a notice naming the
collection it could not read, and the rest of the workspace stays usable. No data
is lost. Once the rules are current the panels populate on reload.

Note: the Firestore rules unit tests (`npm test`) require the emulator, which in
turn needs a Java runtime. Without Java they are skipped, so a green frontend test
run does **not** prove the deployed rules are current — always deploy them.

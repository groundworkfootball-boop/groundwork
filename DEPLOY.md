# GROUNDWORK — Blaze deployment guide

Cloud Functions, Cloud Run and Cloud Tasks require the **Blaze** (pay-as-you-go)
plan. Blaze still includes a free tier that covers normal development usage; you
are billed only for usage above it.

This project is configured with hard cost guardrails so a mistake cannot produce
a large bill:

| Guard | Value | Where |
|---|---|---|
| `maxInstances` | 10 per function | `functions/src/index.ts` |
| `concurrency` | 40 requests per instance | `functions/src/index.ts` |
| `memory` | 256 MiB | `functions/src/index.ts` |
| `timeoutSeconds` | 60 | `functions/src/index.ts` |
| Region | `europe-west2` | `functions/src/index.ts` |

At 10 instances × 256 MiB the absolute worst case is roughly **£0.40/hour** if
every function were saturated continuously — which will not happen at this stage.

---

## 1. Upgrade to Blaze

1. Open <https://console.firebase.google.com/project/groundwork-8ac4f/usage/details>
2. Click **Modify plan** → **Blaze**.
3. Set a **budget alert** at £5 and £20 (Billing → Budgets & alerts). Alerts do
   not cap spending, but they warn you early.

## 2. Authenticate the CLI

```bash
npx firebase login
npx firebase use groundwork-8ac4f
```

## 3. Enable the required APIs

Blaze unlocks them, but they must be switched on once:

```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com \
  --project groundwork-8ac4f
```

## 4. Set secrets (optional — features degrade gracefully without them)

Functions read configuration from `process.env`. Anything unset makes that
feature return a clear "not configured" error instead of crashing, so you can
deploy first and add secrets later.

```bash
# AI (needed for suggestions, video tagging, squad gap analysis)
npx firebase functions:secrets:set ANTHROPIC_API_KEY
npx firebase functions:secrets:set OPENROUTER_API_KEY

# Stripe (needed for subscriptions and boosts)
npx firebase functions:secrets:set STRIPE_SECRET_KEY
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Email (needed for guardian consent invites)
npx firebase functions:secrets:set RESEND_API_KEY
```

Then grant the runtime service account access:

```bash
PROJECT=groundwork-8ac4f
SA=$(gcloud functions describe createAccount --region europe-west2 \
      --project $PROJECT --format='value(serviceConfig.serviceAccountEmail)')

for S in ANTHROPIC_API_KEY OPENROUTER_API_KEY STRIPE_SECRET_KEY \
         STRIPE_WEBHOOK_SECRET RESEND_API_KEY; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project $PROJECT
done
```

## 5. Deploy

```bash
npm run deploy
```

That runs, in order:

1. `tsc -b && vite build` — type-check and build the web app
2. `npm --prefix functions run build` — compile the functions
3. `firebase deploy` — rules, indexes, functions, hosting

To deploy only one target:

```bash
npx firebase deploy --only functions
npx firebase deploy --only firestore:rules,firestore:indexes
npx firebase deploy --only hosting
```

## 6. Post-deploy verification

```bash
# Every callable should return 401/400, never 404
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://europe-west2-groundwork-8ac4f.cloudfunctions.net/createAccount

# Stripe webhook endpoint
curl -s -o /dev/null -w "%{http_code}\n" \
  https://europe-west2-groundwork-8ac4f.cloudfunctions.net/stripeWebhook
```

A `404` means the function is not deployed or is in the wrong region. A `400`
or `401` means it is live and rejecting the unauthenticated request correctly.

## 7. Point Stripe at the webhook

In the Stripe dashboard → Developers → Webhooks → Add endpoint:

```
https://europe-west2-groundwork-8ac4f.cloudfunctions.net/stripeWebhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 8. Create the first admin

Admin accounts cannot be created through registration. After you have registered
a normal account, promote it once with the Admin SDK:

```bash
cd functions
node -e "
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'groundwork-8ac4f' });
admin.auth().setCustomUserClaims('YOUR_UID', { role: 'admin', isSuperAdmin: true })
  .then(() => console.log('done — sign out and back in'));
"
```

Then sign out and back in so the new claims are picked up.

---

## What works without secrets

| Feature | Without secrets |
|---|---|
| Registration, profiles, matching, search | ✅ Fully working |
| Video upload + FFmpeg processing | ✅ Working (Cloud Run worker optional) |
| AI suggestions / tagging / squad gaps | ⚠️ Returns "AI not configured" |
| Stripe subscriptions and boosts | ⚠️ Returns "Stripe not configured" |
| Guardian consent emails | ⚠️ Logs to Cloud Logging instead of sending |

## Rolling back

```bash
npx firebase hosting:rollback
```

Functions can be deleted individually from the console, or the whole codebase
removed with `npx firebase functions:delete --region europe-west2`.

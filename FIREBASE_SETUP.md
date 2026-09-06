# Firebase Setup & Deployment Guide

## 1. Firebase Project Requirements
GROUNDWORK requires three distinct Firebase environments:
- **Development:** `groundwork-8ac4f`
- **Staging:** `groundwork-staging`
- **Production:** `groundwork-production`

Never share data between production and non-production environments.

## 2. Firebase Services Configured
- **Firebase Authentication:** Email/Password and Google Sign-In with Custom Claims (`role`).
- **Cloud Firestore:** Document database configured with strict security rules (`firestore.rules`).
- **Firebase Storage:** Media bucket with size, format, and ownership validation (`storage.rules`).
- **Firebase Hosting:** Fast edge delivery for the Vite Single Page Application.
- **Firebase Cloud Functions:** Modular Node backend for privileged operations.

## 3. Environment Variables (.env)
Create `.env.development` or `.env.production` with the following keys:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=groundwork-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=groundwork-production
VITE_FIREBASE_STORAGE_BUCKET=groundwork-production.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef

# Server / Cloud Function Keys (NEVER expose to frontend)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
AI_PROVIDER=claude # or openrouter
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
SENTRY_DSN=https://...
```

## 4. Deploying Rules and Indexes
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore composite indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Frontend Hosting
firebase deploy --only hosting
```

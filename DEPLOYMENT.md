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

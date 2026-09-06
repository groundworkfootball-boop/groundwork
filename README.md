# GROUNDWORK Football Recruitment & Opportunity Platform

GROUNDWORK is a multi-sided football opportunity platform connecting adult players, youth players, guardians, football clubs, and platform administrators.

---

## ⚽ Key Features

- **Role-Dedicated Portals:** Tailored workflows for Player, Guardian, Club, and Administrator accounts.
- **Unique Club Codes:** Every registered club receives an authoritative alphanumeric identifier (e.g. `GW-ARS-9B2F`) for quick onboarding.
- **Multi-Platform Club Invites:** 1-click sharing via WhatsApp, Email, SMS, Twitter/X, Facebook, LinkedIn, Direct Link Copy, and standalone QR codes.
- **Deterministic Matching Engine:** 100% pure mathematical scoring across 6 weights (Position 30%, Level 20%, Attributes 20%, Region 15%, Availability 10%, Boost 5%). **AI never calculates player match scores.**
- **Transparent Match Explanations:** Real-time percentage contribution breakdown visible to players and scouts.
- **Youth Safeguarding First:** Automatic minor detection (<18), pending consent state, unsearchable by default, and immediate delisting on consent withdrawal.
- **Club Recruitment & Squad Management:** Post opportunities, manage shortlists, coordinate trials, and track squad positional balance.
- **AI Squad Gap Analysis:** Analyzes formation depth to highlight positional gaps and seamlessly routes scouts to qualified deterministic matches.
- **AI Video Observation Tagging:** Objective action tagging (e.g. "Left Foot Action") requiring explicit player approval before saving.
- **Auditable Administration:** Club credential reviews, youth clearance approvals, matching weight adjustments, moderation queue, and GDPR data export/deletion workflows.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, React Router v7, Tailwind CSS, Lucide Icons
- **Backend:** Firebase (Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, Hosting)
- **Payments:** Stripe Subscriptions & Visibility Boosts
- **AI:** Server-side Claude / OpenRouter provider abstraction

---

## 📚 Documentation Directory

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and intelligence separation
- [MATCHING_ENGINE.md](MATCHING_ENGINE.md) - Deterministic scoring algorithm and weight configurations
- [SAFEGUARDING.md](SAFEGUARDING.md) - Youth protection, guardian consent flows, and club verification
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase configuration, rules, and environment setup
- [SECURITY.md](SECURITY.md) - Zero-trust security model and Firestore permission rules
- [DATA_MODEL.md](DATA_MODEL.md) - Complete Firestore schema and collection specifications
- [AI.md](AI.md) - AI provider abstraction and ethical guardrails
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Operational manual for platform administrators
- [TESTING.md](TESTING.md) - Test strategy and critical test runner instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment checklist and commands

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.development` and insert your Firebase project credentials:
```bash
cp .env.example .env.development
```

### 3. Run Critical Unit Tests
```bash
node --experimental-strip-types scripts/test-critical-ts.ts
```

### 4. Type-Check Codebase
```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

### 5. Start Local Development Server
```bash
npm run dev
```

---

## 🔒 Security Principles

1. **Deny by default:** Firestore Security Rules verify document ownership, user role claims, and youth consent server-side.
2. **Deterministic matching:** Player scores are calculated strictly via mathematical rules; AI is barred from scoring or ranking players.
3. **Guardians in control:** Guardian consent is required before any under-18 profile is indexed or visible to clubs. Delisting is immediate upon withdrawal.

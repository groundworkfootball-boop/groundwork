# GROUNDWORK Platform Architecture

## 1. System Overview
GROUNDWORK is a multi-sided football opportunity platform designed for four user roles:
1. **Adult Players**
2. **Youth Players (Under-18)**
3. **Guardians / Parents**
4. **Football Clubs & Academy Scouts**
5. **Platform Administrators & Safeguarding Officers**

```
React 19 SPA (TypeScript + Vite + Tailwind CSS)
            │
            ▼
Firebase Authentication (Custom Claims: player, guardian, club, admin)
            │
            ▼
Cloud Firestore  ◄───►  Cloud Functions (Backend Business Logic)
   │        │
   │        ├──► Firebase Storage (Player clips, thumbnails, safeguarding certs)
   │        ├──► Stripe (Subscriptions, visibility boosts, webhooks)
   │        ├──► Deterministic Scoring Engine (Rule-based 6-weight algorithm)
   │        └──► Server-side AI Provider (Claude / OpenRouter for gap analysis & video tagging)
```

## 2. Core Architectural Separation: Two Intelligence Systems

GROUNDWORK strictly maintains two distinct systems:
- **System 1: Deterministic Matching Engine (Core Business Logic)**
  - Pure, auditable mathematical scoring function.
  - Computes match scores across 6 strict dimensions: Position (30%), Distance (15%), Level (20%), Attributes (20%), Availability (10%), Boost (5%).
  - **AI is strictly forbidden from modifying player scores, weights, or match rankings.**
- **System 2: AI Assistance (Auxiliary Intelligence)**
  - Squad Gap Analysis: Evaluates club formation and roster counts to identify positional shortages.
  - Video Observation Tagging: Suggests objective, observable movement tags (e.g. "Left Foot Action", "Attacking Third") for player approval.
  - Player Improvement Recommendations: Suggests actionable profile enhancements to the player.

## 3. Frontend Architecture
- **Router:** React Router v7 with role-based route protection (`App.tsx`).
- **State & Realtime Data:** React context (`AuthContext`), Firestore real-time listeners & paginated query snapshots.
- **UI/UX:** Dark-mode football aesthetic, responsive layouts with desktop sidebar, mobile navigation, accessible modals, and skeleton loading states.
- **Role Portals:**
  - `/player/*`: Player Dashboard, Opportunities, Applications, Videos, Recommendations, Profile Builder, Settings.
  - `/club/*`: Club Dashboard, Search Players, Squad Roster, Squad Gap Analysis, Invites Hub (Club Code), Trials, Shortlists, Messages, Analytics, Boosts, Subscription, Settings.
  - `/guardian/*`: Guardian Dashboard, Youth Profiles, Consent Management, Consent History, Settings.
  - `/admin/*`: Admin Dashboard, Users, Players, Clubs, Youth Verification, Consent Audits, Matching Config, AI Management, Moderation, Subscriptions, GDPR Requests, System Health.

## 4. Backend & Security Architecture
- **Authoritative Authorization:** Firebase Auth Custom Claims (`role: 'player' | 'guardian' | 'club' | 'admin'`).
- **Multi-Tenant Club Isolation:** Unique alphanumeric club codes (`GW-XXX-XXXX`) for streamlined roster onboarding.
- **Youth Safeguarding:** Strict defense-in-depth with server-side validation, immutable audit logs, and automatic delisting on consent withdrawal.

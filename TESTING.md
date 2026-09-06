# GROUNDWORK Testing Strategy & Verification Guide

## 1. Test Suite Architecture
The platform is validated across four tiers:
1. **Critical Algorithmic Unit Tests:** Pure deterministic scoring engine, club code generation, multi-platform sharing, QR matrix generator.
2. **Database & Security Rules Tests:** Firestore rule authorization matrix (`firestore.test.ts`).
3. **TypeScript Strict Typechecking:** Zero compilation errors (`tsc --noEmit`).
4. **End-to-End User Verification:** Role dashboards, club codes, guardian consent workflows.

## 2. Running Critical Unit Tests
Execute the native unit test suite:
```bash
node --experimental-strip-types scripts/test-critical-ts.ts
```
Expected output:
```
--- RUNNING GROUNDWORK CRITICAL SYSTEM TESTS ---
Testing Deterministic Matching Engine...
✓ Deterministic scoring reproducibility passed
✓ Boost bonus test passed
✓ Distance decay test passed

Testing Club Code Generator & Multi-Platform Sharing...
✓ Unique club code generator passed
✓ Invite URL builder passed
✓ Multi-platform share links generated successfully
✓ Deterministic QR Matrix generated successfully

========================================
ALL GROUNDWORK CRITICAL TESTS PASSED 100%
========================================
```

## 3. Running TypeScript Strict Typecheck
```bash
node ./node_modules/typescript/bin/tsc --noEmit
```
Exits with code `0` and zero errors.

## 4. Running Firestore Emulator Rules Suite
```bash
firebase emulators:exec --only firestore "vitest run"
```
Validates:
- Unverified clubs cannot read youth profiles.
- Withdrawn consent immediately blocks youth search access.
- Guardians cannot inspect unrelated youth documents.
- Admin records cannot be updated by normal users.

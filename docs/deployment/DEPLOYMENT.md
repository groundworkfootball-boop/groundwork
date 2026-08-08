# Deployment Guide

## Workflow
We utilize a Git Flow-inspired model linked to GitHub Actions:
1. **Branch `develop`** -> Deploys to Development (`groundwork-8ac4f`).
2. **Branch `staging`** -> Deploys to Staging (`groundwork-staging`).
3. **Branch `main`** -> Deploys to Production (`groundwork-production`).

## Manual Deployment (Restricted)
Direct manual deployment from a developer machine is restricted and heavily discouraged.
If an absolute emergency requires manual intervention, you must explicitly switch environments using the Firebase CLI:
```bash
firebase use development
firebase deploy --only hosting,firestore
```

**Production deployments are exclusively managed by CI/CD.**

## Configuration
The `firebase.json` file handles the mapping of the local `dist/` directory to Firebase Hosting and defines the rules targets.

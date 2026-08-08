# CI/CD Pipeline Configuration

## Overview
The platform uses GitHub Actions to automate testing and deployment.
The pipeline is located at `.github/workflows/main.yml`.

## Stages
1. **Build and Test**: Runs on all pushes and pull requests to main branches. Includes dependency installation, linting, type-checking, and build validation.
2. **Deploy Development**: Triggers when changes are pushed to `develop`.
3. **Deploy Staging**: Triggers when changes are pushed to `staging`.
4. **Deploy Production**: Triggers when changes are merged to `main`. Requires environment approval.

## Secrets Required
To enable automated deployments, the following secrets must be added to GitHub:
- `FIREBASE_SERVICE_ACCOUNT_GROUNDWORK_DEV`
- `FIREBASE_SERVICE_ACCOUNT_GROUNDWORK_STAGING`
- `FIREBASE_SERVICE_ACCOUNT_GROUNDWORK_PROD`

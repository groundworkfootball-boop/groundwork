# Firebase Environments

## Region Constraint
All Firebase projects **must** use the `europe-west2` (London) region. If a specific Firebase service is unavailable in this region, it must be documented and reviewed before selecting an alternative European region.

## Projects Required
1. **Development**
   - Project ID: `groundwork-8ac4f`
   - Purpose: Day-to-day development.

2. **Staging**
   - Project ID: `groundwork-staging` (Pending)
   - Purpose: Pre-release testing.

3. **Production**
   - Project ID: `groundwork-production` (Pending)
   - Purpose: Live users.

## Configured Services (M1 Foundation)
- **Firebase Authentication**: Ready.
- **Cloud Firestore**: Configured with strict rules.
- **Firebase Storage**: Configured with strict rules.
- **Firebase Hosting**: CI/CD pipeline integrated.

## Action Required from Client
The client must provide or create the following Firebase projects in `europe-west2` and grant access to the CI/CD pipeline / development team:
- Staging Firebase Project
- Production Firebase Project

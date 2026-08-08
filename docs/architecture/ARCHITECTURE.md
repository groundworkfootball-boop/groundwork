# Architecture Overview

## Objective
To establish a scalable, secure, and maintainable foundation for the GROUNDWORK platform before application logic is implemented in Milestone 2.

## Technology Stack
- **Frontend**: React (Vite, TypeScript). Chosen for performance, type safety, and ecosystem maturity.
- **Backend as a Service (BaaS)**: Firebase.
- **Database**: Cloud Firestore (NoSQL).
- **Authentication**: Firebase Auth.
- **Storage**: Firebase Cloud Storage.
- **Hosting**: Firebase Hosting.
- **CI/CD**: GitHub Actions.

## Environment Isolation
Three strictly isolated Firebase environments are mandated:
1. **Development**: For active feature development and testing.
2. **Staging**: For pre-production validation, UAT, and final QA.
3. **Production**: Live user data.

Under no circumstances should the Production environment be used for development, nor should local workstations deploy directly to Production.

## Pathway Separation (Adult vs. Youth)
The platform will serve both adult (18+) non-league players and youth (15-17) grassroots players. Due to differing legal, compliance, and safeguarding requirements, the data architectures for these pathways are separated at the collection level:
- `/players`: Adult profiles
- `/players_youth`: Youth profiles (to be implemented)

This structural separation prevents complex overlapping security rules and accidental exposure of sensitive youth data.

# GROUNDWORK Firestore Data Model

## Core Collections

### 1. `users/{uid}`
- `email`: string
- `name`: string
- `role`: `'player' | 'guardian' | 'club' | 'admin'`
- `createdAt`: serverTimestamp
- `updatedAt`: serverTimestamp

### 2. `players/{uid}`
- `id`: string
- `name`: string
- `email`: string
- `dob`: string (YYYY-MM-DD)
- `isYouth`: boolean
- `consentStatus`: `'pending' | 'granted' | 'withdrawn'`
- `consentGrantedAt`?: serverTimestamp
- `guardianEmail`?: string
- `guardianName`?: string
- `relationship`?: string
- `searchable`: boolean
- `positions`: string[]
- `playingLevel`: number (1-10)
- `region`: string
- `profileCompleteness`: number (0-100)
- `affiliatedClubId`?: string
- `affiliatedClubCode`?: string
- `skillRatings`: Record<string, number>
- `hasActiveBoost`: boolean

### 3. `clubs/{uid}`
- `id`: string
- `name`: string
- `clubCode`: string (e.g. `GW-ARS-9B2F`, unique)
- `league`: string
- `region`: string
- `verifiedAdult`: boolean
- `verifiedYouth`: boolean
- `verificationStatus`: `'pending' | 'under_review' | 'approved' | 'rejected'`
- `targetPositions`: string[]
- `targetLevel`: number
- `requiredAvailability`: string[]
- `subscriptionTier`: `'free' | 'standard' | 'premium'`

### 4. `clubInvites/{inviteId}`
- `clubId`: string
- `clubName`: string
- `clubCode`: string
- `inviteeEmail`: string
- `inviteeName`?: string
- `role`: `'player' | 'coach' | 'scout' | 'trialist'`
- `status`: `'pending' | 'accepted' | 'revoked' | 'expired'`
- `createdAt`: serverTimestamp

### 5. `squadMembers/{memberId}`
- `clubId`: string
- `playerId`?: string
- `name`: string
- `position`: string
- `ageGroup`: string
- `playingLevel`: number
- `status`: `'active' | 'trial' | 'injured'`
- `addedAt`: serverTimestamp

### 6. `playerVideos/{videoId}`
- `playerId`: string
- `title`: string
- `url`: string
- `processingStatus`: `'pending' | 'processing' | 'ready' | 'failed'`
- `aiTags`: string[]
- `published`: boolean
- `createdAt`: serverTimestamp

### 7. `consentAudit/{auditId}`
- `youthId`: string
- `guardianId`: string
- `action`: `'granted' | 'withdrawn' | 're-granted'`
- `timestamp`: serverTimestamp
- `privacyNoticeVersion`: string

### 8. `matchingConfigs/default`
- `positionWeight`: 0.30
- `distanceWeight`: 0.15
- `levelWeight`: 0.20
- `attributesWeight`: 0.20
- `availabilityWeight`: 0.10
- `boostWeight`: 0.05
- `version`: number

# Youth Safeguarding & Guardian Consent Architecture

## 1. Core Safeguarding Principles
Youth safeguarding is an absolute security requirement enforced at the database and API layer, not merely in the user interface.

- **Automatic Minor Detection:** Registration automatically calculates age from date of birth (`dob`). If `age < 18`:
  - `isYouth = true`
  - `consentStatus = 'pending'`
  - `searchable = false`
- **Default Hidden:** Youth profiles NEVER appear in club search until guardian consent is explicitly verified.
- **Access Control:** Only verified clubs with active, unexpired youth recruitment clearance (`verifiedYouth == true`) and the youth's verified guardian can access youth records.

## 2. Guardian Consent Flow
1. **Consent Request:** A youth account registers with guardian contact information (`guardianName`, `guardianEmail`, `relationship`).
2. **Guardian Dashboard:** The guardian logs into the dedicated Guardian Portal (`/guardian`).
3. **Review Plain-Language Disclosures:** Statutory privacy notices, data processing terms, and visibility boundaries are presented.
4. **Granting Consent:** When granted:
   - `consentStatus = 'granted'`
   - `consentGrantedAt = serverTimestamp()`
   - `searchable = true`
   - An immutable record is created in `consentAudit/{auditId}`.
5. **Withdrawing Consent:** Guardians can withdraw consent at any time with a single click:
   - `consentStatus = 'withdrawn'`
   - `searchable = false` (Immediate delisting from all searches)
   - Media and videos queued for deletion.
   - AI processing permanently blocked.
   - An immutable record is created in `consentAudit/{auditId}` with action `'withdrawn'`.

## 3. Club Youth Verification
Clubs must submit:
- Official FA / Governing Body affiliation documents.
- Named Safeguarding Officer contact details.
- Valid safeguarding certification with an expiry date.

Admin reviews and approves or denies youth recruitment clearance. If clearance expires, youth access is automatically revoked in Firestore rules.

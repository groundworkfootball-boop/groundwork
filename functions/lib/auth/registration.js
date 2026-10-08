import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '../shared/firebaseAdmin.js';
import { writeAuditLog } from '../shared/audit.js';
import { REGISTRATION_EXTRA_SCHEMA, EMAIL_SCHEMA, NAME_SCHEMA } from '../shared/validation.js';
import { generateClubCode } from '../shared/clubCode.js';
const ROLE_SCHEMA = z.enum(['player', 'guardian', 'club']);
const schema = z.object({
    email: EMAIL_SCHEMA,
    password: z.string().min(8).max(128),
    role: ROLE_SCHEMA,
    name: NAME_SCHEMA,
    extra: REGISTRATION_EXTRA_SCHEMA.default({ isYouth: false }),
});
/** Server-side account registration. Admin accounts can never be created here. */
export const createAccount = onCall(async (request) => {
    if (request.auth) {
        // We only allow unauthenticated account creation through this path.
    }
    const parsed = schema.safeParse(request.data ?? {});
    if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new HttpsError('invalid-argument', first ? `${first.path.join('.')}: ${first.message}` : 'Invalid registration data.');
    }
    const { email, password, role, name, extra } = parsed.data;
    try {
        const user = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: false,
        });
        const uid = user.uid;
        const isYouth = Boolean(extra.isYouth && typeof extra.dob === 'string' && isUnder18(extra.dob));
        await adminDb.collection('users').doc(uid).set({
            uid,
            email,
            name,
            role,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            emailVerified: false,
            disabled: false,
        });
        if (role === 'player') {
            await adminDb.collection('players').doc(uid).set({
                uid,
                email,
                name,
                displayName: name,
                role: 'player',
                isYouth,
                searchable: !isYouth,
                consentStatus: isYouth ? 'pending' : 'n/a',
                profileCompleteness: 0,
                dob: extra.dob,
                positions: extra.positions ?? [],
                playingLevel: extra.playingLevel,
                region: extra.region,
                availability: extra.availability ?? [],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                updatedAtMs: Date.now(),
            });
            if (isYouth) {
                await adminDb.collection('youthProfiles').doc(uid).set({
                    playerId: uid,
                    guardianName: extra.guardianName ?? '',
                    guardianEmail: extra.guardianEmail ?? '',
                    relationship: extra.relationship ?? '',
                    consentStatus: 'pending',
                    privacyNoticeVersion: '1.0',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        }
        else if (role === 'guardian') {
            await adminDb.collection('guardians').doc(uid).set({
                uid,
                email,
                name,
                role: 'guardian',
                linkedYouthIds: [],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }
        else if (role === 'club') {
            const clubCode = generateClubCode(name);
            await adminDb.collection('clubs').doc(uid).set({
                uid,
                email,
                name,
                role: 'club',
                clubCode,
                verificationStatus: 'pending',
                verifiedAdult: false,
                verifiedYouth: false,
                targetPositions: [],
                targetPlayingLevels: [],
                league: extra.league,
                region: extra.region,
                clubType: extra.clubType,
                preferredRadiusKm: extra.preferredRadiusKm,
                trainingAvailability: [],
                trialAvailability: [],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            await adminAuth.setCustomUserClaims(uid, { role, isSuperAdmin: false });
            await adminAuth.generateEmailVerificationLink(email);
            await writeAuditLog({
                action: 'registration_completed',
                resourceType: 'users',
                resourceId: uid,
                actorId: 'system',
                actorRole: role,
                metadata: { isYouth },
            });
            return { uid, role, isYouth, clubCode };
        }
        await adminAuth.setCustomUserClaims(uid, { role, isYouth, isSuperAdmin: false });
        await adminAuth.generateEmailVerificationLink(email);
        await writeAuditLog({
            action: 'registration_completed',
            resourceType: 'users',
            resourceId: uid,
            actorId: 'system',
            actorRole: role,
            metadata: { isYouth },
        });
        return { uid, role, isYouth };
    }
    catch (err) {
        const code = err.code;
        if (code === 'auth/email-already-in-use') {
            throw new HttpsError('already-exists', 'An account with this email already exists.');
        }
        console.error('createAccount failed', code ?? err);
        throw new HttpsError('internal', 'Could not create your account. Please try again.');
    }
});
/** Deterministic minor detection: under 18 on 31 Dec of the DOB year's Jan 1? Use exact date. */
export function isUnder18(dob) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!match)
        return false;
    const birth = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate()))
        age -= 1;
    return age < 18;
}
/** Sync custom claims whenever the users/{uid} document is created. */
export const syncClaimsOnUserCreated = onDocumentCreated('users/{userId}', async (event) => {
    const data = event.data?.data() ?? {};
    const role = data.role;
    if (!['player', 'guardian', 'club', 'admin'].includes(role ?? ''))
        return;
    await adminAuth.setCustomUserClaims(event.params.userId, { role });
});

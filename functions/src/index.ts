// Auth
export { setUserRoleClaims, adminSetUserRole, adminGetUserClaims } from './auth/claims.js';
export { createAccount, syncClaimsOnUserCreated } from './auth/registration.js';

// Safeguarding
export {
  sendConsentInvite,
  grantConsent,
  withdrawConsent,
  reGrantConsent,
  onConsentChange,
} from './safeguarding/consent.js';

// Matching engine
export { updateMatchingConfig, getMatchingConfigState } from './matching/configs.js';
export {
  onPlayerProfileChanged,
  onPlayerDeleted,
  onClubProfileChanged,
  onMatchJobCreated,
} from './matching/recalculate.js';

// Player profiles
export { updatePlayerProfile } from './players/profile.js';

// Videos
export { initiateVideoUpload } from './videos/uploads.js';
export { onVideoRawUpload, onVideoObjectDeleted } from './videos/processing.js';
export { setVideoPublished, deleteVideo, moderateVideo } from './videos/manage.js';

// Club verification & profiles
export {
  updateClubProfile,
  submitVerification,
  reviewVerification,
  suspendClub,
  expireYouthVerifications,
} from './clubs/verification.js';

// Payments (Stripe)
export { createCheckoutSession, createBillingPortalSession } from './payments/checkout.js';
export { stripeWebhook } from './payments/webhook.js';
export { adminReviewClubVerification } from './clubs/adminVerification.js';
export { adminSetPlayerVisibility } from './admin/playerVisibility.js';

// AI (advisory-only)
export { analyzeSquadGaps } from './ai/squadGap.js';
export { getAIRecommendations } from './ai/recommendations.js';
export { getPlayerRecommendations } from './ai/playerRecommendations.js';
export { tagVideoContent } from './ai/videoTagging.js';
export { getAIUsageStats, testAIConnection, clearAICache } from './ai/admin.js';

// Notifications & safety triggers
export {
  onApplicationStatusChanged,
  onApplicationCreated,
  onTrialUpdated,
  onConsentWithdrawnCancelJobs,
} from './notifications/triggers.js';






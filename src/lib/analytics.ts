/**
 * GROUNDWORK — Analytics Tracking (PostHog)
 * 
 * Track user events without sending sensitive youth data.
 * Only active when VITE_POSTHOG_KEY is configured.
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY || APP_ENV === 'development') return;

  posthog.init(POSTHOG_KEY, {
    api_host: 'https://eu.posthog.com',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    disable_session_recording: true,
    // GDPR: respect Do Not Track
    respect_dnt: true,
    // Don't send PII automatically
    sanitize_properties: (properties) => {
      const sanitized = { ...properties };
      // Remove any email addresses that might leak
      for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'string' && sanitized[key].includes('@')) {
          sanitized[key] = '[redacted]';
        }
      }
      return sanitized;
    },
  });

  initialized = true;
}

export function identifyUser(uid: string, role: string) {
  if (!initialized) return;
  posthog.identify(uid, { role, environment: APP_ENV });
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

// ─── Event Tracking ──────────────────────────────────────────────────────────
// Never send sensitive youth data to analytics.

export type AnalyticsEvent =
  | 'registration_started'
  | 'registration_completed'
  | 'profile_completed'
  | 'video_uploaded'
  | 'video_processed'
  | 'video_published'
  | 'club_registered'
  | 'club_verified'
  | 'search_performed'
  | 'player_profile_viewed'
  | 'shortlist_created'
  | 'player_shortlisted'
  | 'application_submitted'
  | 'trial_created'
  | 'trial_accepted'
  | 'subscription_started'
  | 'boost_purchased'
  | 'consent_granted'
  | 'consent_withdrawn'
  | 'ai_feature_used'
  | 'page_viewed'
  | 'opportunity_viewed'
  | 'match_explanation_viewed'
  | 'recommendation_dismissed'
  | 'video_tag_accepted'
  | 'video_tag_rejected'
  | 'gdpr_request_submitted';

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (!initialized) return;
  // Extra safety: never pass youth-specific identifiers
  const safe = properties ? { ...properties } : {};
  delete safe.youthId;
  delete safe.guardianEmail;
  delete safe.guardianName;
  posthog.capture(event, safe);
}

export function trackPageView(pageName: string) {
  if (!initialized) return;
  posthog.capture('page_viewed', { page: pageName });
}

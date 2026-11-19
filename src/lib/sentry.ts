/**
 * GROUNDWORK — Sentry Error Monitoring
 * 
 * Initializes Sentry for frontend error tracking.
 * Only active when VITE_SENTRY_DSN is configured.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    // Don't send PII
    beforeSend(event) {
      // Strip email addresses from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.message) {
            crumb.message = crumb.message.replace(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
              '[email]'
            );
          }
          return crumb;
        });
      }
      return event;
    },
    ignoreErrors: [
      // Firebase auth errors users can fix themselves
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/email-already-in-use',
      'auth/popup-closed-by-user',
      'auth/network-request-failed',
      // Browser extensions
      /^ResizeObserver loop/,
      // Common non-actionable errors
      'Loading chunk',
      'ChunkLoadError',
    ],
  });

  initialized = true;
}

export function setUser(uid: string, role: string) {
  if (!SENTRY_DSN) return;
  Sentry.setUser({ id: uid, role });
}

export function clearUser() {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error('[sentry:disabled]', error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

export { Sentry };

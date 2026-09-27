export declare const NOTIFICATION_TYPES: readonly ["application_received", "application_status_changed", "shortlisted", "trial_invitation", "trial_reminder", "guardian_consent", "verification_status", "subscription", "payment", "boost", "ai_recommendation", "system_notification"];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    /** When true, an email gateway is attempted (best-effort, non-blocking). */
    email?: boolean;
}
/**
 * Server-side notification create. All privileged events route through here so
 * that in-app + email channels are consistent and audited.
 */
export declare function createNotification(input: CreateNotificationInput): Promise<string>;
export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}
/**
 * Email provider abstraction. Set EMAIL_PROVIDER=console (default, development)
 * to log, or EMAIL_PROVIDER=resend|sendgrid and configure the matching secret to
 * route through a provider. Firebase Auth is used for auth-related emails.
 */
export declare function sendEmail(payload: EmailPayload): Promise<void>;
export declare function firebaseAuthEmailLink(code: string): string;

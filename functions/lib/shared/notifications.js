import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin.js';
export const NOTIFICATION_TYPES = [
    'application_received',
    'application_status_changed',
    'shortlisted',
    'trial_invitation',
    'trial_reminder',
    'guardian_consent',
    'verification_status',
    'subscription',
    'payment',
    'boost',
    'ai_recommendation',
    'system_notification',
];
/**
 * Server-side notification create. All privileged events route through here so
 * that in-app + email channels are consistent and audited.
 */
export async function createNotification(input) {
    const ref = adminDb.collection('notifications').doc();
    await ref.set({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        metadata: input.metadata ?? {},
        emailSent: input.email === true ? false : true,
    });
    if (input.email === true) {
        const userSnap = await adminDb.collection('users').doc(input.userId).get();
        const email = userSnap.exists ? userSnap.data()?.email : undefined;
        if (email) {
            try {
                await sendEmail({ to: email, subject: input.title, html: simpleHtml(input.title, input.body) });
                await ref.update({ emailSent: true });
            }
            catch (err) {
                console.warn('Email delivery failed for notification', ref.id, err);
            }
        }
    }
    return ref.id;
}
function simpleHtml(title, body) {
    const safe = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div style="font-family:Inter,sans-serif;background:#0b1121;padding:24px;border-radius:12px">
  <div style="color:#ccff00;font-weight:800;font-size:18px">GROUNDWORK</div>
  <h2 style="color:#ffffff">${safe(title)}</h2>
  <p style="color:#cbd5e1">${safe(body).replace(/\n/g, '<br/>')}</p>
  <p style="color:#64748b;font-size:12px">You received this because you have a GROUNDWORK account.</p>
</div>`;
}
/**
 * Email provider abstraction. Set EMAIL_PROVIDER=console (default, development)
 * to log, or EMAIL_PROVIDER=resend|sendgrid and configure the matching secret to
 * route through a provider. Firebase Auth is used for auth-related emails.
 */
export async function sendEmail(payload) {
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
    if (provider === 'console') {
        console.log(`[email:console] to=${payload.to} subject=${payload.subject}`);
        return;
    }
    if (provider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey)
            throw new Error('RESEND_API_KEY is not configured.');
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'noreply@groundwork.football', to: [payload.to], subject: payload.subject, html: payload.html }),
        });
        if (!res.ok)
            throw new Error(`Resend failed: ${res.status}`);
        return;
    }
    if (provider === 'sendgrid') {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey)
            throw new Error('SENDGRID_API_KEY is not configured.');
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: payload.to }] }],
                from: { email: process.env.EMAIL_FROM ?? 'noreply@groundwork.football' },
                subject: payload.subject,
                content: [{ type: 'text/html', value: payload.html }],
            }),
        });
        if (!res.ok)
            throw new Error(`SendGrid failed: ${res.status}`);
        return;
    }
    throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
}
export function firebaseAuthEmailLink(code) {
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
    return `https://${process.env.AUTH_DOMAIN ?? 'groundwork.firebaseapp.com'}/action?mode=${code}`;
}

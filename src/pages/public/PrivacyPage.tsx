import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';

const SECTIONS = [
  {
    title: 'Who we are',
    body: 'Groundwork Football Technologies Ltd operates a football recruitment platform connecting players, guardians and clubs across the UK.',
  },
  {
    title: 'What we collect',
    body: 'Account details (name, email), profile data you provide (positions, attributes, availability, playing history), video you upload, and technical logs required to operate the service securely.',
  },
  {
    title: 'Youth data',
    body: 'For under-18 accounts we collect guardian contact details and consent records. Youth profiles are hidden until a guardian grants consent, and are only visible to clubs holding live youth verification.',
  },
  {
    title: 'How we use it',
    body: 'To compute deterministic match scores, present your profile to eligible clubs, process applications and trials, operate subscriptions, and meet safeguarding and legal obligations.',
  },
  {
    title: 'AI processing',
    body: 'AI is used only for advisory features: video descriptions, squad gap notes and profile suggestions. Youth data is never sent to an AI provider without granted guardian consent. AI never determines a match score.',
  },
  {
    title: 'Legal basis',
    body: 'We rely on contract performance for core platform features, consent for youth processing and optional AI features, and legitimate interests for security and fraud prevention.',
  },
  {
    title: 'Retention',
    body: 'Profile data is retained while your account is active. Consent audit records and financial transaction records are retained for statutory periods even after an erasure request.',
  },
  {
    title: 'Your rights',
    body: 'You can request access, correction, export or deletion of your data from your account settings or by contacting us. You may also lodge a complaint with the Information Commissioner\u2019s Office.',
  },
  {
    title: 'Processors',
    body: 'We use Google Firebase (hosting, database, storage, authentication), Stripe (payments) and an AI provider for advisory features. Each is bound by a data processing agreement.',
  },
  {
    title: 'Contact',
    body: 'Data protection enquiries: support@groundwork.football. Safeguarding concerns are prioritised and reviewed by our safeguarding lead.',
  },
];

export const PrivacyPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="Privacy"
        title="Privacy notice"
        description="How Groundwork collects, uses and protects personal data, including youth data and AI processing."
      />

      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <Card key={section.title} padding="md">
              <h2 className="text-[14px] font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{section.body}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-[11.5px] text-slate-600">
          Last updated {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>
      </section>
    </PublicLayout>
  );
};

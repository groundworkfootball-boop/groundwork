import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';

const SECTIONS = [
  {
    title: '1. Agreement',
    body: 'By creating an account you agree to these terms. If you are under 18, a parent or guardian must grant consent before your profile becomes visible to clubs.',
  },
  {
    title: '2. Accounts',
    body: 'You must provide accurate information and keep your credentials secure. Administrator accounts are provisioned internally and are never available through public registration.',
  },
  {
    title: '3. Acceptable use',
    body: 'You must not misrepresent your identity, playing history or club affiliation; upload content you do not own; attempt to access data you are not authorised to see; or use the platform to contact minors outside approved workflows.',
  },
  {
    title: '4. Match scores',
    body: 'Match scores are produced by a deterministic rule engine using the data you and clubs provide. They are advisory compatibility indicators, not guarantees of selection, trial or contract.',
  },
  {
    title: '5. AI features',
    body: 'AI-generated descriptions and suggestions are advisory. You may accept, edit or reject them. AI output never determines a match score, ranking or verification decision.',
  },
  {
    title: '6. Club verification',
    body: 'Clubs must complete verification before recruiting. Youth recruitment additionally requires safeguarding documentation and is granted for a fixed period that expires automatically.',
  },
  {
    title: '7. Payments',
    body: 'Subscriptions and boosts are processed by Stripe. Prices are shown before checkout. Subscription state is authoritative on the server and is not controlled by the client.',
  },
  {
    title: '8. Content',
    body: 'You retain ownership of the video and profile content you upload and grant us a licence to host, process and display it to eligible users for the purpose of recruitment.',
  },
  {
    title: '9. Suspension',
    body: 'We may suspend or remove accounts that breach these terms, present a safeguarding risk, or are subject to a valid legal request.',
  },
  {
    title: '10. Liability',
    body: 'The platform is provided as-is. We do not guarantee that any player will be scouted, trialled or signed, and we are not a party to any agreement between a player and a club.',
  },
  {
    title: '11. Changes',
    body: 'We may update these terms. Material changes will be communicated before they take effect.',
  },
];

export const TermsPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="Terms"
        title="Terms of service"
        description="The rules that govern use of the Groundwork platform for players, guardians and clubs."
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

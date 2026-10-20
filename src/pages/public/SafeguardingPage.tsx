import { ShieldCheck, CheckCircle2, AlertTriangle, Lock, FileCheck2, Users } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SafeguardingIllustration } from '../../components/illustrations';

const LIFECYCLE = [
  {
    state: 'Consent pending',
    tone: 'amber' as const,
    body: 'The profile is hidden and unsearchable. No club can read it, even with a direct database request.',
  },
  {
    state: 'Consent granted',
    tone: 'emerald' as const,
    body: 'Visible only to clubs holding live youth verification. Expiry is evaluated on every read.',
  },
  {
    state: 'Consent withdrawn',
    tone: 'rose' as const,
    body: 'Delisted immediately, AI processing blocked, associated media queued for deletion.',
  },
];

const CONTROLS = [
  {
    icon: Lock,
    title: 'Enforced in security rules',
    body: 'Firestore rules evaluate consent state, searchability, club verification and expiry on every single read.',
  },
  {
    icon: ShieldCheck,
    title: 'Enforced in Cloud Functions',
    body: 'Privileged operations re-check the same invariants before reading or writing youth data.',
  },
  {
    icon: FileCheck2,
    title: 'Immutable audit trail',
    body: 'Every grant, withdrawal and re-grant writes an append-only record no client can modify or delete.',
  },
  {
    icon: Users,
    title: 'Guardian control',
    body: 'Only the guardian linked to the profile can grant or withdraw consent, verified by their authenticated email.',
  },
];

export const SafeguardingPage = () => {
  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="Safeguarding"
        title="Youth protection is architecture, not a checkbox."
        description="Groundwork treats safeguarding as a system-wide security requirement. Every relevant backend operation evaluates role, verification, expiry, guardian relationship and consent state."
      >
        <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
          Deny by default
        </Badge>
      </PublicPageHeader>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SafeguardingIllustration />
          </div>
          <div>
            <h2 className="gw-display text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
              A minor&apos;s profile is invisible until a guardian says otherwise.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Consent is not a UI toggle. It is enforced in Firestore rules, in Cloud Functions and in Storage rules —
              so bypassing the React application changes nothing.
            </p>

            <div className="mt-7 space-y-3">
              {LIFECYCLE.map((item) => (
                <div key={item.state} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <Badge tone={item.tone} dot>
                    {item.state}
                  </Badge>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/30">
        <div className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
          <h2 className="gw-display text-[clamp(1.6rem,3vw,2.2rem)] text-white">Defence in depth</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-400">
            Four independent layers must all agree before youth data is returned.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {CONTROLS.map((control) => (
              <Card key={control.title} padding="md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                  <control.icon className="h-4.5 w-4.5 text-emerald-300" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{control.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{control.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card padding="lg">
            <h3 className="text-[15px] font-semibold text-white">Club youth verification</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                'Approved adult verification is required first',
                'Safeguarding documentation reviewed by a safeguarding admin',
                'Grants expire after 12 months',
                'Expiry is checked on every read — access lapses automatically',
                'Every decision is written to the audit log',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-[12.5px] leading-relaxed text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg">
            <h3 className="text-[15px] font-semibold text-white">AI and youth data</h3>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
              Youth data is never sent to an AI provider unless consent is granted. This is checked before enqueueing,
              when the worker picks up the job, and immediately before the provider request.
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-[12px] leading-relaxed text-amber-100/85">
                If consent is withdrawn while a job is queued, the job is skipped. Guardian contact details are never
                included in AI prompts.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};

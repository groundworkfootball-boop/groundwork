import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileCheck2, Lock, ScrollText, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../lib/useAsync';
import { listGuardianConsentAudits } from '../../lib/services/guardianService';
import { isPermissionDenied } from '../../lib/errors';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import type { ConsentAuditRecord } from '../../app/types';

const ACTION_TONE = {
  granted: 'emerald',
  're-granted': 'brand',
  withdrawn: 'rose',
} as const;

function formatTimestamp(seconds?: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ConsentHistoryPage = () => {
  const { user } = useAuth();
  const audits = useAsync(() => listGuardianConsentAudits(user!.uid), [user?.uid], {
    enabled: Boolean(user?.uid),
  });

  const denied = isPermissionDenied(audits.error);
  const grouped = useMemo(() => {
    const rows = (audits.data ?? []) as ConsentAuditRecord[];
    return rows.reduce<Record<string, ConsentAuditRecord[]>>((acc, row) => {
      const key = row.youthId ?? 'unknown';
      (acc[key] ??= []).push(row);
      return acc;
    }, {});
  }, [audits.data]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Guardian portal"
        title="Consent history"
        description="An append-only record of every consent decision made on your linked players. Entries cannot be edited or removed."
        breadcrumbs={[
          { label: 'Consent centre', to: '/dashboard/guardian/consent' },
          { label: 'History' },
        ]}
        actions={
          <ButtonLink
            to="/dashboard/guardian/consent"
            size="sm"
            variant="secondary"
            iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Back
          </ButtonLink>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/[0.05] p-4">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <div>
          <p className="text-[13px] font-semibold text-white">Immutable by design</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-400">
            Each entry stores the action, timestamp, privacy-notice version and source. Clients cannot
            write to this collection — only Cloud Functions and authorised administrators can, which
            keeps the trail trustworthy.
          </p>
        </div>
      </div>

      {audits.loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton rows={5} />
          <CardSkeleton rows={5} />
        </div>
      ) : denied ? (
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="Consent history unavailable"
          description="The deployed Firestore rules are older than this build. Deploy the current ruleset to read your consent trail."
          action={
            <code className="rounded bg-black/40 px-2 py-1 font-mono text-[11.5px] text-slate-300">
              npm run deploy:rules
            </code>
          }
        />
      ) : audits.error ? (
        <ErrorState
          title="Could not load consent history"
          description="The audit trail request failed. Please try again."
          onRetry={audits.reload}
        />
      ) : (audits.data ?? []).length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="h-6 w-6" />}
          title="No consent records yet"
          description="When you grant or withdraw consent for a linked player, an immutable record appears here."
          action={
            <ButtonLink to="/dashboard/guardian/consent" size="sm">
              Open consent centre
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card>
            <CardHeader
              title="Timeline"
              description={`${(audits.data ?? []).length} record${(audits.data ?? []).length === 1 ? '' : 's'}`}
              icon={<FileCheck2 className="h-4 w-4" />}
            />
            <ol className="mt-5 space-y-4 border-l border-white/[0.08] pl-4">
              {Object.entries(grouped).map(([youthId, rows]) => (
                <li key={youthId} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-850 bg-brand" />
                  <p className="gw-mono text-slate-500">
                    Player {youthId.slice(0, 8)}…
                  </p>
                  <ul className="mt-2 space-y-2">
                    {rows.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge tone={ACTION_TONE[row.action] ?? 'slate'} dot>
                            {row.action}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(row.timestamp?.seconds)}
                          </span>
                        </div>
                        <span className="gw-mono text-slate-600">
                          notice v{row.privacyNoticeVersion ?? '1.0'} · {row.source || 'portal'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>

          <div className="space-y-4">
            <Card variant="flat">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[12.5px] font-semibold text-white">What each action means</p>
                  <ul className="mt-2.5 space-y-2 text-[11.5px] leading-relaxed text-slate-400">
                    <li>
                      <span className="font-semibold text-emerald-300">granted</span> — the profile may
                      appear to clubs with live youth verification.
                    </li>
                    <li>
                      <span className="font-semibold text-rose-300">withdrawn</span> — delisted
                      immediately; media queued for deletion.
                    </li>
                    <li>
                      <span className="font-semibold text-brand">re-granted</span> — consent restored
                      after a withdrawal.
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Link
              to="/safeguarding"
              className="block rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.16]"
            >
              <p className="text-[12.5px] font-semibold text-white">Read the safeguarding policy</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                Full detail on data retention, withdrawal and club verification.
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

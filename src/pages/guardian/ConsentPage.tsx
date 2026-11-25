import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  PRIVACY_NOTICE_VERSION,
  grantConsent,
  linkYouthAccount,
  listLinkedYouth,
  withdrawConsent,
  type LinkedYouth,
} from '../../lib/services/guardianConsentService';
import { cn } from '../../components/ui/cn';
import { MediaFrame } from '../../components/visual/MediaFrame';

const STATUS_META = {
  pending: {
    label: 'Consent pending',
    tone: 'amber' as const,
    copy: 'Hidden from every club search until you approve.',
  },
  granted: {
    label: 'Consent granted',
    tone: 'emerald' as const,
    copy: 'Visible only to clubs with live youth verification.',
  },
  withdrawn: {
    label: 'Consent withdrawn',
    tone: 'rose' as const,
    copy: 'Delisted. Match results removed and media queued for deletion.',
  },
};

export const ConsentPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [youths, setYouths] = useState<LinkedYouth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setYouths(await listLinkedYouth(user.email));
    } catch (err) {
      console.error(err);
      setError('We could not load your linked players. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinkError(null);
    if (!childEmail.trim() || !user?.email) {
      setLinkError('Enter the email the player registered with.');
      return;
    }
    setLinking(true);
    try {
      const result = await linkYouthAccount({
        guardianEmail: user.email,
        guardianName: user.name,
        relationship,
        childEmail: childEmail.trim(),
      });
      success(
        result.mode === 'callable'
          ? `${result.name ?? 'Player'} linked. Consent is pending until you approve.`
          : 'Link request submitted. An administrator will confirm the relationship.',
      );
      setChildEmail('');
      setShowLink(false);
      await load();
    } catch (err) {
      setLinkError((err as Error)?.message || 'We could not link that account.');
    } finally {
      setLinking(false);
    }
  };

  const handleDecision = async (youth: LinkedYouth, decision: 'granted' | 'withdrawn') => {
    if (decision === 'granted' && !acknowledged) {
      toastError('Confirm the safeguarding notice before granting consent.');
      return;
    }
    setProcessingId(youth.id);
    try {
      const result = decision === 'granted' ? await grantConsent(youth.id) : await withdrawConsent(youth.id);

      if (result.mode === 'callable') {
        setYouths((prev) =>
          prev.map((entry) => (entry.id === youth.id ? { ...entry, consentStatus: decision } : entry)),
        );
        success(
          decision === 'granted'
            ? `Consent granted for ${youth.name}. Only live-verified youth clubs can now see the profile.`
            : `Consent withdrawn for ${youth.name}. Profile delisted immediately.`,
        );
      } else {
        success('Request recorded. A safeguarding administrator will apply it and write the audit record.');
      }
    } catch (err) {
      console.error(err);
      toastError('We could not update consent. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Guardian portal"
        title="Consent centre"
        description="Your approval is the only thing that makes a youth profile visible. Withdrawal is immediate and audited."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLink((value) => !value)}
            iconLeft={<UserPlus className="h-3.5 w-3.5" />}
          >
            {showLink ? 'Close' : 'Link a player'}
          </Button>
        }
      />

      {showLink ? (
        <Card>
          <form onSubmit={handleLink} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Input
                label="Player email"
                type="email"
                value={childEmail}
                onChange={(event) => setChildEmail(event.target.value)}
                placeholder="player@example.com"
                error={linkError}
                required
              />
              <Select
                label="Relationship"
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
              >
                {['Parent', 'Legal guardian', 'Carer', 'Other responsible adult'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-500">
              The account must already exist and be flagged as a youth profile. Adult accounts cannot be linked.
            </p>
            <Button type="submit" loading={linking} size="sm">
              Send link request
            </Button>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : youths.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No linked players yet"
          description="Once you link a youth account, you control exactly what verified clubs can see."
          action={
            <Button size="sm" onClick={() => setShowLink(true)} iconLeft={<UserPlus className="h-3.5 w-3.5" />}>
              Link a player
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {youths.map((youth) => {
              const meta = STATUS_META[youth.consentStatus] ?? STATUS_META.pending;
              const busy = processingId === youth.id;
              return (
                <Card key={youth.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-white">{youth.name}</h3>
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{meta.copy}</p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
                    {[
                      ['Date of birth', youth.dob ?? '—'],
                      ['Account', youth.email ?? '—'],
                      ['Notice', PRIVACY_NOTICE_VERSION],
                      ['Status', youth.consentStatus],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2">
                        <dt className="gw-mono text-slate-500">{label}</dt>
                        <dd className="mt-0.5 truncate font-medium text-slate-200">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {youth.consentStatus !== 'granted' ? (
                      <Button
                        size="sm"
                        loading={busy}
                        onClick={() => handleDecision(youth, 'granted')}
                        iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Grant consent
                      </Button>
                    ) : null}
                    {youth.consentStatus !== 'withdrawn' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busy}
                        onClick={() => handleDecision(youth, 'withdrawn')}
                        iconLeft={<AlertTriangle className="h-3.5 w-3.5" />}
                      >
                        Withdraw consent
                      </Button>
                    ) : null}
                    <Link
                      to="/dashboard/guardian/consent-history"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-400 transition-colors hover:text-white"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Audit history
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card variant="flat">
              <p className="text-[12.5px] font-semibold text-white">Before you grant consent</p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.10] bg-ink-950/50 p-3">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-ink-950 accent-brand"
                />
                <span className="text-[12px] leading-relaxed text-slate-300">
                  I have read the safeguarding notice and understand I can withdraw consent at any time.
                </span>
              </label>
              <Link
                to="/safeguarding"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Read the full policy
              </Link>
            </Card>

            <MediaFrame
              src="/images/floodlights.jpg"
              alt="Floodlit pitch safeguarding barrier"
              caption="Consent enforced in rules & functions"
              tag="Audit logged"
            />

            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={load}
              iconLeft={<RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {processingId ? (
        <p className="flex items-center gap-2 text-[12px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Applying consent change…
        </p>
      ) : null}
    </div>
  );
};
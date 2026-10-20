import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Download, Users, Target, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type ReportKey = 'safeguarding' | 'recruitment' | 'clubs';

interface ReportDefinition {
  key: ReportKey;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  tone: 'emerald' | 'brand' | 'sky';
}

const REPORTS: ReportDefinition[] = [
  {
    key: 'safeguarding',
    title: 'Safeguarding & consent ledger',
    description: 'Youth registrations, guardian linkage and every immutable consent event.',
    icon: ShieldCheck,
    tone: 'emerald',
  },
  {
    key: 'recruitment',
    title: 'Recruitment funnel',
    description: 'Applications by status, opportunity and club with timestamps.',
    icon: Target,
    tone: 'brand',
  },
  {
    key: 'clubs',
    title: 'Club verification ledger',
    description: 'Verification state, adult and youth grants, and expiry dates.',
    icon: Users,
    tone: 'sky',
  },
];

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text =
      typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }
  return lines.join('\r\n');
}

function download(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const ReportsPage = () => {
  const { success, error: toastError } = useToast();
  const [counts, setCounts] = useState<Record<ReportKey, number | null>>({
    safeguarding: null,
    recruitment: null,
    clubs: null,
  });
  const [busy, setBusy] = useState<ReportKey | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const [consent, applications, clubs] = await Promise.all([
        getDocs(query(collection(db, 'consentAudits'), limit(500))),
        getDocs(query(collection(db, 'applications'), limit(500))),
        getDocs(query(collection(db, 'clubs'), limit(500))),
      ]);
      setCounts({
        safeguarding: consent.size,
        recruitment: applications.size,
        clubs: clubs.size,
      });
    } catch (err) {
      console.warn('[reports] count probe failed', err);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const generate = async (key: ReportKey) => {
    setBusy(key);
    try {
      let rows: Array<Record<string, unknown>> = [];

      if (key === 'safeguarding') {
        const snapshot = await getDocs(query(collection(db, 'consentAudits'), limit(2000)));
        rows = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            auditId: entry.id,
            youthId: data.youthId ?? '',
            guardianId: data.guardianId ?? '',
            action: data.action ?? '',
            privacyNoticeVersion: data.privacyNoticeVersion ?? '',
            source: data.source ?? '',
            timestamp: data.timestamp?.seconds
              ? new Date(data.timestamp.seconds * 1000).toISOString()
              : '',
          };
        });
      }

      if (key === 'recruitment') {
        const snapshot = await getDocs(query(collection(db, 'applications'), limit(2000)));
        rows = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            applicationId: entry.id,
            playerId: data.playerId ?? '',
            clubId: data.clubId ?? '',
            opportunityId: data.opportunityId ?? '',
            opportunityTitle: data.opportunityTitle ?? '',
            status: data.status ?? '',
            createdAt: data.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000).toISOString()
              : '',
          };
        });
      }

      if (key === 'clubs') {
        const snapshot = await getDocs(query(collection(db, 'clubs'), limit(2000)));
        rows = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            clubId: entry.id,
            name: data.name ?? '',
            region: data.region ?? '',
            league: data.league ?? '',
            verificationStatus: data.verificationStatus ?? '',
            verifiedAdult: data.verifiedAdult === true,
            verifiedYouth: data.verifiedYouth === true,
            youthVerificationExpiresAt: data.youthVerificationExpiresAt?.seconds
              ? new Date(data.youthVerificationExpiresAt.seconds * 1000).toISOString()
              : '',
          };
        });
      }

      if (rows.length === 0) {
        toastError('There is no data to export for this report yet.');
        return;
      }

      const csv = toCsv(rows);
      const stamp = new Date().toISOString().slice(0, 10);
      download(`groundwork-${key}-${stamp}.csv`, csv);
      success(`Exported ${rows.length} rows.`);
    } catch (err) {
      console.error(err);
      toastError('We could not generate that report. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reporting"
        title="Compliance & operations reports"
        description="Exports are generated from live Firestore data and downloaded as CSV in your browser."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.key} padding="md" className="flex flex-col">
            <span
              className={
                report.tone === 'emerald'
                  ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10'
                  : report.tone === 'brand'
                    ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand/10'
                    : 'flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10'
              }
            >
              <report.icon
                className={
                  report.tone === 'emerald'
                    ? 'h-4.5 w-4.5 text-emerald-300'
                    : report.tone === 'brand'
                      ? 'h-4.5 w-4.5 text-brand'
                      : 'h-4.5 w-4.5 text-sky-300'
                }
              />
            </span>
            <h3 className="mt-4 text-[14px] font-semibold text-white">{report.title}</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-slate-400">{report.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <Badge tone="slate">
                {counts[report.key] === null ? '—' : `${counts[report.key]} records`}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => generate(report.key)}
                loading={busy === report.key}
                iconLeft={<Download className="h-3.5 w-3.5" />}
              >
                Export CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-[13px] font-semibold text-white">How exports work</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
              Each report reads directly from Firestore under your administrator permissions and builds the CSV in the
              browser — no data leaves the platform. Consent audit records are included because statutory retention
              requires them; they are never deleted by a GDPR erasure request.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};


import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Save, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  safeguardingEmail: string;
  maintenanceMode: boolean;
  youthAutoDelist: boolean;
  requireEmailVerification: boolean;
}

const DEFAULTS: PlatformSettings = {
  platformName: 'GROUNDWORK',
  supportEmail: '',
  safeguardingEmail: '',
  maintenanceMode: false,
  youthAutoDelist: true,
  requireEmailVerification: true,
};

export const SettingsPage = () => {
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDoc(doc(db, 'systemSettings', 'platform'));
      if (snapshot.exists()) {
        setSettings({ ...DEFAULTS, ...(snapshot.data() as Partial<PlatformSettings>) });
      }
    } catch (err) {
      console.error(err);
      setError('We could not load platform settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'systemSettings', 'platform'),
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      success('Platform settings saved.');
    } catch (err) {
      console.error(err);
      toastError('Could not save settings. Super-admin access is required.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader eyebrow="Administration" title="Platform settings" />
        <Card padding="lg">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform settings"
        description="Global configuration. Writes require super-admin claims and are audited."
        actions={
          <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Reload
          </Button>
        }
      />

      <form onSubmit={save} className="space-y-5">
        <Card padding="lg">
          <CardHeader title="Identity" description="How the platform presents itself" />
          <div className="mt-5 space-y-4">
            <Input
              label="Platform name"
              value={settings.platformName}
              onChange={(e) => setSettings((prev) => ({ ...prev, platformName: e.target.value }))}
              maxLength={80}
            />
            <Input
              label="Support email"
              type="email"
              placeholder="support@example.com"
              value={settings.supportEmail}
              onChange={(e) => setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
            />
            <Input
              label="Safeguarding contact"
              type="email"
              placeholder="safeguarding@example.com"
              value={settings.safeguardingEmail}
              onChange={(e) => setSettings((prev) => ({ ...prev, safeguardingEmail: e.target.value }))}
            />
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            title="Safety controls"
            description="These affect every user immediately"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <div className="mt-5 space-y-3">
            {[
              {
                key: 'youthAutoDelist' as const,
                label: 'Auto-delist youth on consent withdrawal',
                body: 'Removes the profile from search and queues media deletion immediately.',
              },
              {
                key: 'requireEmailVerification' as const,
                label: 'Require verified email for privileged actions',
                body: 'Blocks applications and verification submissions until the email is confirmed.',
              },
              {
                key: 'maintenanceMode' as const,
                label: 'Maintenance mode',
                body: 'Shows a maintenance notice to non-administrators.',
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={settings[toggle.key]}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [toggle.key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-950 text-brand focus:ring-brand/30"
                />
                <span>
                  <span className="block text-[13px] font-medium text-white">{toggle.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">{toggle.body}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[12px] leading-relaxed text-amber-100/85">
            Safeguarding toggles cannot weaken the server-side invariants. Youth visibility always requires granted
            consent and live club verification, regardless of these settings.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} iconLeft={<Save className="h-4 w-4" />}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
};

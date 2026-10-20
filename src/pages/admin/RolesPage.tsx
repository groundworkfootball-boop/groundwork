import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { ShieldCheck, Search, Users, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

interface UserRow {
  id: string;
  email: string;
  name?: string;
  role?: string;
  disabled?: boolean;
}

interface ClaimsState {
  role: string | null;
  flags: Record<string, boolean>;
}

const BASE_ROLES = [
  { value: 'player', label: 'Player' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'club', label: 'Club' },
  { value: 'admin', label: 'Admin' },
] as const;

const ADMIN_FLAGS = [
  { key: 'isSuperAdmin', label: 'Super admin', hint: 'Full control including role assignment' },
  { key: 'isModerator', label: 'Moderator', hint: 'Content and profile moderation' },
  { key: 'isSafeguardingAdmin', label: 'Safeguarding admin', hint: 'Youth verification and consent' },
  { key: 'isFinanceAdmin', label: 'Finance admin', hint: 'Payments, refunds and subscriptions' },
] as const;

const ROLE_TONE: Record<string, 'brand' | 'sky' | 'rose' | 'slate' | 'emerald'> = {
  player: 'brand',
  guardian: 'emerald',
  club: 'sky',
  admin: 'rose',
};

export const RolesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [claims, setClaims] = useState<ClaimsState | null>(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = Boolean((user as { isSuperAdmin?: boolean } | null)?.isSuperAdmin);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200)));
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserRow, 'id'>) })));
    } catch (err) {
      console.error('[roles] user list failed', err);
      setLoadError('Could not load users. Check your admin permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadClaims = useCallback(async (uid: string) => {
    setClaimsLoading(true);
    setClaims(null);
    try {
      const callable = httpsCallable<{ uid: string }, ClaimsState & { uid: string }>(functions, 'adminGetUserClaims');
      const { data } = await callable({ uid });
      setClaims({ role: data.role, flags: data.flags ?? {} });
    } catch (err) {
      console.error('[roles] claims read failed', err);
      toastError('Could not read authoritative claims for this user.');
    } finally {
      setClaimsLoading(false);
    }
  }, [toastError]);

  const selectUser = (row: UserRow) => {
    setSelected(row);
    void loadClaims(row.id);
  };

  const save = async () => {
    if (!selected || !claims) return;
    setSaving(true);
    try {
      const callable = httpsCallable<Record<string, unknown>, { ok: boolean }>(functions, 'adminSetUserRole');
      await callable({
        uid: selected.id,
        role: claims.role ?? undefined,
        flags: claims.flags,
        reason: 'Changed from admin roles console',
      });
      success('Role updated. The user must sign in again for claims to take effect.');
      setUsers((prev) => prev.map((u) => (u.id === selected.id ? { ...u, role: claims.role ?? u.role } : u)));
    } catch (err) {
      console.error('[roles] save failed', err);
      toastError('Could not update this role.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) => u.email?.toLowerCase().includes(term) || u.name?.toLowerCase().includes(term) || u.id.includes(term),
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Roles & permissions"
        description="Roles are stored as Firebase custom claims — the authoritative source for every rule and callable."
        actions={
          <Button variant="secondary" size="sm" onClick={loadUsers} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      {!isSuperAdmin && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[12.5px] leading-relaxed text-amber-200">
            You can view roles but only a super admin can change administrative roles or flags.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card padding="none">
          <div className="border-b border-white/[0.06] p-4">
            <Input
              placeholder="Search by name, email or UID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              iconLeft={<Search className="h-4 w-4" />}
            />
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : loadError ? (
            <div className="p-6">
              <EmptyState
                icon={<AlertCircle className="h-6 w-6" />}
                title="Could not load users"
                description={loadError}
                action={
                  <Button variant="secondary" size="sm" onClick={loadUsers}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Users className="h-6 w-6" />} title="No matching users" description="Adjust your search." />
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectUser(row)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                      selected?.id === row.id ? 'bg-brand/[0.06]' : ''
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[12px] font-bold uppercase text-slate-300">
                      {(row.name || row.email || '?').slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white">{row.name || row.email}</span>
                      <span className="block truncate text-[11.5px] text-slate-500">{row.email}</span>
                    </span>
                    <Badge tone={ROLE_TONE[row.role ?? 'player'] ?? 'slate'}>{row.role ?? 'player'}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md" className="h-fit lg:sticky lg:top-6">
          {!selected ? (
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Select a user"
              description="Choose a user to inspect and edit their authoritative claims."
            />
          ) : claimsLoading ? (
            <div className="flex items-center gap-2 py-8 text-[13px] text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading claims…
            </div>
          ) : !claims ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="Claims unavailable"
              description="The adminGetUserClaims callable did not respond."
              action={
                <Button variant="secondary" size="sm" onClick={() => loadClaims(selected.id)}>
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[13px] font-semibold text-white">{selected.name || selected.email}</p>
                <p className="mt-0.5 break-all text-[11px] text-slate-500">{selected.id}</p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Base role</p>
                <div className="grid grid-cols-2 gap-2">
                  {BASE_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      disabled={!isSuperAdmin && r.value === 'admin'}
                      onClick={() => setClaims({ ...claims, role: r.value })}
                      className={`rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        claims.role === r.value
                          ? 'border-brand/50 bg-brand/10 text-brand'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Internal flags
                </p>
                <div className="space-y-2">
                  {ADMIN_FLAGS.map((flag) => (
                    <label
                      key={flag.key}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5 transition-colors hover:border-white/20 ${
                        !isSuperAdmin ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isSuperAdmin}
                        checked={Boolean(claims.flags[flag.key])}
                        onChange={(e) => setClaims({ ...claims, flags: { ...claims.flags, [flag.key]: e.target.checked } })}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-ink-950 text-brand focus:ring-brand/30"
                      />
                      <span>
                        <span className="block text-[12.5px] font-medium text-white">{flag.label}</span>
                        <span className="block text-[11px] text-slate-500">{flag.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                fullWidth
                onClick={save}
                loading={saving}
                disabled={!isSuperAdmin}
                iconLeft={<Check className="h-4 w-4" />}
              >
                Save claims
              </Button>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Saving revokes the user's refresh tokens so the new claims apply on their next sign-in.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};


import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Users, Search, User, Mail, Calendar, Loader2, AlertCircle, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../lib/toast';
import { db, functions } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

interface UserDoc {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean;
  isModerator?: boolean;
  isSafeguardingAdmin?: boolean;
  isFinanceAdmin?: boolean;
  createdAt?: { seconds: number };
  disabled?: boolean;
  suspended?: boolean;
}

function formatDate(ts?: { seconds: number }): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_TONE: Record<string, 'brand' | 'sky' | 'rose' | 'emerald' | 'slate'> = {
  player: 'brand',
  guardian: 'emerald',
  club: 'sky',
  admin: 'rose',
};

export const UsersList = () => {
  const { user: currentUser, adminFlags } = useAuth();
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [filtered, setFiltered] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const canSuspend = adminFlags.isSuperAdmin || adminFlags.isModerator;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(250)));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc));
        setUsers(data);
        setFiltered(data);
      } catch (err) {
        console.error('Users list error:', err);
        setFetchError('Failed to load users. Admin custom claims are required.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      users.filter((u) => {
        const matchesSearch = !term || u.email?.toLowerCase().includes(term) || u.name?.toLowerCase().includes(term);
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    );
  }, [searchTerm, roleFilter, users]);

  const toggleDisabled = async (target: UserDoc) => {
    if (!canSuspend) {
      toastError('Moderator or Super-Admin custom claims are required.');
      return;
    }
    const nextDisabled = !(target.disabled || target.suspended);
    setBusyId(target.id);
    try {
      const callable = httpsCallable<{ uid: string; disabled: boolean; reason?: string }, { ok: boolean }>(
        functions,
        'adminSuspendUser',
      );
      await callable({
        uid: target.id,
        disabled: nextDisabled,
        reason: nextDisabled ? 'Suspended from Admin Users Console' : 'Reinstated from Admin Users Console',
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, disabled: nextDisabled, suspended: nextDisabled } : u)),
      );
      success(`User ${nextDisabled ? 'suspended and tokens revoked' : 'reinstated'}.`);
    } catch (err) {
      console.error(err);
      toastError((err as { message?: string })?.message ?? 'Failed to update user status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="User directory"
        description="Inspect registered accounts and enforce server-side suspensions across Auth and Firestore."
        actions={<Badge tone="brand">{users.length} accounts</Badge>}
      />

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              iconLeft={<Search className="h-4 w-4" />}
              aria-label="Search users"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'player', 'guardian', 'club', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  roleFilter === r
                    ? 'border-brand bg-brand text-ink-950'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      ) : fetchError ? (
        <Card>
          <div className="flex items-start gap-3 text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-[13px]">{fetchError}</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No users found"
          description={searchTerm || roleFilter !== 'all' ? 'Adjust your search or role filter.' : 'No registered users yet.'}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">User</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Role</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Joined</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((u) => {
                  const isSuspended = Boolean(u.disabled || u.suspended);
                  const isSelf = u.id === currentUser?.uid;
                  return (
                    <tr key={u.id} className={isSuspended ? 'opacity-60' : undefined}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-white">{u.name || '—'}</p>
                            <p className="flex items-center gap-1 truncate text-[11.5px] text-slate-500">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={ROLE_TONE[u.role] ?? 'slate'}>{u.role}</Badge>
                          {u.isSuperAdmin ? <Badge tone="rose">Super</Badge> : null}
                          {u.isSafeguardingAdmin ? <Badge tone="emerald">Safeguarding</Badge> : null}
                          {u.isFinanceAdmin ? <Badge tone="sky">Finance</Badge> : null}
                          {u.isModerator ? <Badge tone="amber">Mod</Badge> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(u.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={isSuspended ? 'rose' : 'emerald'} dot>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <ShieldAlert className="h-3 w-3" /> Current session
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isSuspended ? 'secondary' : 'danger'}
                            loading={busyId === u.id}
                            disabled={!canSuspend}
                            onClick={() => toggleDisabled(u)}
                            iconLeft={
                              isSuspended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />
                            }
                          >
                            {isSuspended ? 'Reinstate' : 'Suspend'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

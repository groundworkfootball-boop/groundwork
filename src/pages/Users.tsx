import { useEffect, useState } from 'react';
import { Users, Search, User, Mail, Calendar, Loader2, AlertCircle, Ban, CheckCircle2 } from 'lucide-react';
import { useToast } from '../lib/toast';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface UserDoc {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: { seconds: number };
  disabled?: boolean;
}

function formatDate(ts?: { seconds: number }): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_BADGE: Record<string, string> = {
  player: 'text-brand bg-brand/10 border-brand/30',
  club: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  admin: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export const UsersList = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [filtered, setFiltered] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc));
        setUsers(data);
        setFiltered(data);
      } catch (err) {
        console.error('Users list error:', err);
        setFetchError('Failed to load users. You may need admin permissions in Firestore rules.');
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const toggleDisabled = async (user: UserDoc) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        disabled: !user.disabled,
        updatedAt: serverTimestamp(),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, disabled: !u.disabled } : u)));
      success(`User ${user.disabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (err) {
      console.error(err);
      toastError('Failed to update user status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Users className="w-7 h-7 text-brand" />
            <span>User Management</span>
          </h3>
          <p className="text-text-secondary text-sm mt-1">Manage platform users, roles, and permissions.</p>
        </div>
        <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold rounded uppercase tracking-widest">
          {users.length} Total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-dark-surface border border-dark-border rounded-lg px-9 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex space-x-2">
          {['all', 'player', 'club', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                roleFilter === r
                  ? 'bg-brand text-dark-bg border-brand'
                  : 'bg-dark-surface border-dark-border text-text-secondary hover:border-text-secondary/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      )}

      {!loading && fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">{fetchError}</p>
            <p className="text-red-400/70 text-xs mt-1">
              Ensure your Firestore rules allow admin users to read the <code>users</code> collection.
            </p>
          </div>
        </div>
      )}

      {!loading && !fetchError && filtered.length === 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-text-primary mb-2">No users found</h4>
          <p className="text-text-secondary text-sm">
            {searchTerm || roleFilter !== 'all'
              ? 'No users match your current filters.'
              : 'No users have registered yet.'}
          </p>
        </div>
      )}

      {!loading && !fetchError && filtered.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/50">
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">User</th>
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Role</th>
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Joined</th>
                  <th className="text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Status</th>
                  <th className="text-right text-[10px] font-bold text-text-secondary uppercase tracking-widest px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((u) => (
                  <tr key={u.id} className={`hover:bg-dark-bg/30 transition-colors ${u.disabled ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.name || '—'}</p>
                          <p className="text-xs text-text-secondary flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{u.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest ${ROLE_BADGE[u.role] ?? 'text-text-secondary border-dark-border'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-text-secondary flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(u.createdAt)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${u.disabled ? 'text-red-400' : 'text-brand'}`}>
                        {u.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleDisabled(u)}
                          className={`flex items-center space-x-1 px-3 py-1.5 border rounded text-xs font-bold transition-colors ${
                            u.disabled
                              ? 'border-brand/30 text-brand hover:bg-brand/10'
                              : 'border-red-400/30 text-red-400 hover:bg-red-400/10'
                          }`}
                        >
                          {u.disabled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Enable</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Disable</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

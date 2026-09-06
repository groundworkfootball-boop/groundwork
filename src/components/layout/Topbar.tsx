import { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const Topbar = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // Real-time unread notification count
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    }, (err) => {
      console.warn('Notification listener error:', err);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    success('Signed out successfully.');
    navigate('/login');
  };

  const roleLabel: Record<string, string> = {
    player: 'Player Workspace',
    club: 'Club Recruitment Command',
    guardian: 'Guardian Oversight Portal',
    admin: 'Administrator Hub',
  };

  return (
    <header className="hidden lg:flex h-20 bg-slate-950/55 backdrop-blur-xl border-b border-white/10 items-center justify-between px-8 sticky top-0 z-20 relative">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Operational View
          </div>
          <h2 className="mt-0.5 text-sm font-semibold text-white">
            {roleLabel[role ?? ''] ?? 'Dashboard'}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to={role === 'club' ? '/dashboard/club/notifications' : '/dashboard/notifications'}
          className="relative p-2.5 text-slate-300 hover:text-white border border-white/10 hover:border-brand/30 rounded-2xl transition-colors bg-white/5"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-slate-950 text-[8px] font-black rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="flex items-center space-x-2 px-3 py-2 border border-white/10 rounded-2xl hover:border-brand/30 transition-colors text-sm bg-white/5"
          >
            <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-brand" />
            </div>
            <span className="hidden sm:inline font-medium text-white max-w-32 truncate">
              {user?.name || user?.email || 'User'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium truncate text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/dashboard/admin/matching-config"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Matching Config</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-300 hover:bg-red-400/10 transition-colors border-t border-white/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

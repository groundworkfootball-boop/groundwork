import { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
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
      // Silently fail — notifications are non-critical
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
    player: 'Player',
    club: 'Club',
    admin: 'Admin',
  };

  return (
    <header className="h-16 bg-dark-bg/80 backdrop-blur-sm border-b border-dark-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center">
        <h2 className="text-base font-semibold text-text-primary">
          {roleLabel[role ?? ''] ?? 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Environment badge */}
        <span className="hidden sm:inline text-xs px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20 font-medium uppercase tracking-wider">
          {import.meta.env.VITE_APP_ENV || 'DEV'}
        </span>

        {/* Notification bell */}
        <button className="relative p-2 text-text-secondary hover:text-text-primary border border-transparent hover:border-dark-border rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-dark-bg text-[8px] font-black rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="flex items-center space-x-2 px-3 py-1.5 border border-dark-border rounded-lg hover:border-brand/30 transition-colors text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-dark-surface border border-brand/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-brand" />
            </div>
            <span className="hidden sm:inline font-medium text-text-primary max-w-32 truncate">
              {user?.name || user?.email || 'User'}
            </span>
            <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMenu && (
            <>
              {/* Click-away overlay */}
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-border">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-bg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/dashboard/system-config"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-bg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/5 transition-colors border-t border-dark-border"
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

import { useState, useEffect } from 'react';
import {
  Bell,
  User,
  Settings,
  LogOut,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  getRememberedAccounts,
  removeRememberedAccount,
  type RememberedAccount,
} from '../../lib/sessionStorage';

export const Topbar = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);

  // Real-time unread notification count
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUnreadCount(snap.size);
      },
      (err) => {
        console.warn('Notification listener error:', err);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  // Load remembered accounts on opening menu
  useEffect(() => {
    if (showMenu) {
      setRememberedAccounts(getRememberedAccounts());
    }
  }, [showMenu]);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    success('Session ended. Signed out securely.');
    navigate('/login');
  };

  const handleRemoveAccount = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    removeRememberedAccount(uid);
    setRememberedAccounts(getRememberedAccounts());
    success('Account removed from this device.');
  };

  const handleSwitchAccount = async (acc: RememberedAccount) => {
    if (acc.uid === user?.uid) {
      setShowMenu(false);
      return;
    }
    // Switch to another account - log out active and redirect to login prefilled
    await logout();
    navigate('/login', { state: { prefillEmail: acc.email } });
  };

  const getInitials = (name?: string, email?: string | null): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'GW';
  };

  const roleStyles: Record<string, { ring: string; text: string; bg: string; label: string; glow: string }> = {
    player: {
      ring: 'ring-[#ccff00] border-[#ccff00]',
      text: 'text-[#ccff00]',
      bg: 'bg-[#ccff00]/10',
      label: 'Player Workspace',
      glow: 'shadow-[0_0_16px_rgba(204,255,0,0.25)]',
    },
    club: {
      ring: 'ring-amber-400 border-amber-400',
      text: 'text-amber-400',
      bg: 'bg-amber-400/10',
      label: 'Club Recruitment Command',
      glow: 'shadow-[0_0_16px_rgba(251,191,36,0.25)]',
    },
    guardian: {
      ring: 'ring-cyan-400 border-cyan-400',
      text: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      label: 'Guardian Oversight Portal',
      glow: 'shadow-[0_0_16px_rgba(34,211,238,0.25)]',
    },
    admin: {
      ring: 'ring-purple-400 border-purple-400',
      text: 'text-purple-400',
      bg: 'bg-purple-400/10',
      label: 'Administrator Hub',
      glow: 'shadow-[0_0_16px_rgba(192,132,252,0.25)]',
    },
  };

  const currentRoleStyle = roleStyles[role ?? 'player'] || roleStyles.player;

  return (
    <header className="hidden lg:flex h-20 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border items-center justify-between px-8 sticky top-0 z-30">
      {/* Left Title & Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-dark-border bg-dark-surface/80 px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="h-3 w-3 text-brand" />
            LIVE ECOSYSTEM
          </div>
          <h2 className="mt-0.5 text-sm font-black text-white tracking-tight uppercase">
            {currentRoleStyle.label}
          </h2>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications Icon */}
        <Link
          to={role === 'club' ? '/dashboard/club/notifications' : '/dashboard/notifications'}
          className="relative p-2.5 text-slate-300 hover:text-white border border-dark-border hover:border-brand/40 rounded-2xl transition-all duration-200 bg-dark-surface hover:bg-dark-surface/80"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(204,255,0,0.6)] animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Remembered Account Circle Icon Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="flex items-center space-x-3 p-1.5 pr-4 border border-dark-border hover:border-brand/40 rounded-full transition-all duration-200 bg-dark-surface hover:bg-white/5 group focus:outline-none focus:ring-2 focus:ring-brand/40"
            title="Account & Session Overview"
          >
            {/* Circle Avatar Icon */}
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-transform duration-200 group-hover:scale-105 border-2 ${currentRoleStyle.ring} ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.glow}`}
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials(user?.name, user?.email)}</span>
                )}
              </div>
              {/* Active presence online badge */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-dark-bg rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-white truncate max-w-[130px] leading-tight">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${currentRoleStyle.text}`}>
                  {role}
                </span>
                <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          </button>

          {/* Account & Session Popover Modal */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-3 w-84 bg-dark-surface border border-dark-border rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Account Header */}
                <div className="p-5 border-b border-dark-border bg-gradient-to-b from-white/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 ${currentRoleStyle.ring} ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.glow} shrink-0`}
                    >
                      {user?.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(user?.name, user?.email)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white truncate">
                          {user?.name || 'Account'}
                        </p>
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Session Storage Pill */}
                  <div className="mt-3.5 p-2 rounded-xl bg-dark-bg/80 border border-dark-border flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Session Storage Active
                    </span>
                    <span className="text-brand font-mono font-bold text-[10px] uppercase">
                      Remembered
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="p-2 space-y-1">
                  <Link
                    to={role === 'club' ? '/dashboard/club/profile' : '/dashboard/profile'}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <User className="w-4 h-4 text-brand" />
                    <span>My Dossier / Profile</span>
                  </Link>

                  <Link
                    to={role === 'club' ? '/dashboard/club/settings' : role === 'guardian' ? '/dashboard/guardian/settings' : '/dashboard/settings'}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Workspace Settings & Privacy</span>
                  </Link>

                  {role === 'admin' && (
                    <Link
                      to="/dashboard/admin/matching-config"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-500/10 rounded-2xl transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Matching Engine Algorithm</span>
                    </Link>
                  )}

                  {role === 'club' && (
                    <Link
                      to="/dashboard/club/verification"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/10 rounded-2xl transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Club Verification Status</span>
                    </Link>
                  )}
                </div>

                {/* Remembered Accounts on this Device */}
                {rememberedAccounts.length > 0 && (
                  <div className="p-3 border-t border-dark-border bg-dark-bg/40">
                    <p className="px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Remembered Accounts on Device
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {rememberedAccounts.map((acc) => {
                        const isCurrent = acc.uid === user?.uid;
                        return (
                          <div
                            key={acc.uid}
                            onClick={() => handleSwitchAccount(acc)}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                              isCurrent
                                ? 'bg-brand/10 border-brand/30 text-white'
                                : 'bg-dark-surface/60 border-dark-border hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-brand shrink-0">
                                {getInitials(acc.name, acc.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate text-[11px] leading-tight">
                                  {acc.name}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate capitalize">
                                  {acc.role} {isCurrent && '• Active'}
                                </p>
                              </div>
                            </div>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveAccount(e, acc.uid)}
                                className="p-1 hover:text-red-400 text-slate-500 rounded transition-colors"
                                title="Remove remembered account"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sign Out Button */}
                <div className="p-2 border-t border-dark-border bg-dark-bg/70">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out & Clear Active Session</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

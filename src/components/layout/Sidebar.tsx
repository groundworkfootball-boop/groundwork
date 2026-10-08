import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { type ClassValue, clsx } from 'clsx';
import { useAuth, type Role } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Users,
  CalendarCheck,
  User,
  Settings,
  ShieldCheck,
  FileText,
  Star,
  LogOut,
  Search,
  Menu,
  Lightbulb,
  Share2,
  Video,
  Sliders,
  DollarSign,
  Lock,
  Activity,
  MessageSquare,
  Building2,
  Zap,
  BarChart3,
  CheckCircle2,
  X,
  CreditCard,
  FileCheck2,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useToast } from '../../lib/toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
  badge?: string;
};

const navigation: NavItem[] = [
  // Common / Role Dashboards
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['player', 'guardian', 'club', 'admin'] },

  // Player Navigation
  { name: 'Opportunities', href: '/dashboard/opportunities', icon: Target, roles: ['player'] },
  { name: 'Profile Builder', href: '/dashboard/player/profile-builder', icon: SparkleIcon, roles: ['player'], badge: 'Setup' },
  { name: 'My Applications', href: '/dashboard/applications', icon: FileText, roles: ['player'] },
  { name: 'Video Clips', href: '/dashboard/videos', icon: Video, roles: ['player'] },
  { name: 'AI Suggestions', href: '/dashboard/recommendations', icon: Lightbulb, roles: ['player'], badge: 'AI' },
  { name: 'Trials Invited', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['player'] },
  { name: 'Player Profile', href: '/dashboard/profile', icon: User, roles: ['player'] },
  { name: 'Pro & Boosts', href: '/dashboard/subscription', icon: Zap, roles: ['player'] },
  { name: 'Settings & Privacy', href: '/dashboard/settings', icon: Settings, roles: ['player'] },

  // Club Navigation
  { name: 'Search Players', href: '/dashboard/search', icon: Search, roles: ['club'] },
  { name: 'Club Onboarding', href: '/dashboard/club/onboarding', icon: SparkleIcon, roles: ['club'], badge: 'Wizard' },
  { name: 'Club Invites & Code', href: '/dashboard/club/invites', icon: Share2, roles: ['club'] },
  { name: 'Squad Roster', href: '/dashboard/club/squad', icon: Users, roles: ['club'] },
  { name: 'AI Squad Gaps', href: '/dashboard/club/squad-gaps', icon: Lightbulb, roles: ['club'], badge: 'AI' },
  { name: 'Shortlists', href: '/dashboard/shortlist', icon: Star, roles: ['club'] },
  { name: 'Applications', href: '/dashboard/applications', icon: FileText, roles: ['club'] },
  { name: 'Trials Manager', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['club'] },
  { name: 'Club Profile', href: '/dashboard/club/profile', icon: Building2, roles: ['club'] },
  { name: 'Club Verification', href: '/dashboard/club/verification', icon: ShieldCheck, roles: ['club'], badge: 'Verify' },
  { name: 'Subscription Plans', href: '/dashboard/club/subscription', icon: CreditCard, roles: ['club'] },
  { name: 'Recruitment Boosts', href: '/dashboard/club/boosts', icon: Zap, roles: ['club'] },
  { name: 'Recruitment Analytics', href: '/dashboard/club/analytics', icon: BarChart3, roles: ['club'] },
  { name: 'Messages & Outreach', href: '/dashboard/club/messages', icon: MessageSquare, roles: ['club'] },
  { name: 'Club Settings', href: '/dashboard/club/settings', icon: Settings, roles: ['club'] },

  // Guardian Navigation
  { name: 'Youth Profile', href: '/dashboard/guardian/youth-profile', icon: User, roles: ['guardian'] },
  { name: 'Consent Center', href: '/dashboard/guardian/consent', icon: ShieldCheck, roles: ['guardian'], badge: 'Required' },
  { name: 'Consent Audit Trail', href: '/dashboard/guardian/consent-history', icon: FileCheck2, roles: ['guardian'] },
  { name: 'Guardian Settings', href: '/dashboard/guardian/settings', icon: Settings, roles: ['guardian'] },

  // Admin Navigation
  { name: 'Admin Dashboard', href: '/dashboard/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Users Management', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Players Directory', href: '/dashboard/admin/players', icon: Target, roles: ['admin'] },
  { name: 'Clubs Verification', href: '/dashboard/admin/clubs', icon: Building2, roles: ['admin'] },
  { name: 'Youth Safeguarding', href: '/dashboard/admin/youth-verification', icon: ShieldCheck, roles: ['admin'] },
  { name: 'Consent Audits', href: '/dashboard/admin/consent', icon: FileCheck2, roles: ['admin'] },
  { name: 'Matching Config', href: '/dashboard/admin/matching-config', icon: Sliders, roles: ['admin'], badge: 'Pure' },
  { name: 'AI Intelligence Logs', href: '/dashboard/admin/ai', icon: Lightbulb, roles: ['admin'] },
  { name: 'Moderation Queue', href: '/dashboard/admin/moderation', icon: ShieldCheck, roles: ['admin'] },
  { name: 'Platform Reports', href: '/dashboard/admin/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Revenue & Stripe', href: '/dashboard/admin/payments', icon: DollarSign, roles: ['admin'] },
  { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: CreditCard, roles: ['admin'] },
  { name: 'GDPR Data Requests', href: '/dashboard/admin/gdpr', icon: Lock, roles: ['admin'] },
  { name: 'System Audit Trail', href: '/dashboard/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'System Health & Metrics', href: '/dashboard/admin/system-health', icon: Activity, roles: ['admin'] },
  { name: 'Platform Settings', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },
];

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navigation.filter((item) => role && item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    success('Signed out successfully.');
    navigate('/login');
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

  const roleTheme: Record<string, { border: string; text: string; bg: string }> = {
    player: { border: 'border-[#ccff00]', text: 'text-[#ccff00]', bg: 'bg-[#ccff00]/10' },
    club: { border: 'border-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' },
    guardian: { border: 'border-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    admin: { border: 'border-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10' },
  };

  const theme = roleTheme[role ?? 'player'] || roleTheme.player;

  const shellNav = (
    <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
      {filteredNav.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <NavLink
            key={`${item.name}-${item.href}`}
            to={item.href}
            end={item.href === '/dashboard' || item.href === '/dashboard/admin/dashboard'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive: matchActive }) =>
              cn(
                'flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-200 border group',
                matchActive || isActive
                  ? 'bg-dark-bg text-brand border-brand/30 shadow-[0_0_12px_rgba(204,255,0,0.1)] font-bold'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/5',
              )
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={cn(
                  'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0',
                  item.badge === 'AI'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : item.badge === 'Verify' || item.badge === 'Required'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-brand/10 text-brand border-brand/20',
                )}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-dark-surface border-r border-dark-border flex-col h-screen sticky top-0 shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-dark-border">
          <NavLink to="/" className="flex items-center gap-3 mb-3 group">
            <div className="h-11 w-11 rounded-2xl bg-dark-bg border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(204,255,0,0.2)] group-hover:scale-105 transition-transform">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase text-white group-hover:text-brand transition-colors">
                Groundwork
              </h1>
              <p className="text-[10px] text-slate-400 tracking-[0.22em] uppercase font-bold">
                Recruitment OS
              </p>
            </div>
          </NavLink>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                Workspace
              </p>
              <p className="text-xs font-black text-white capitalize mt-0.5">
                {role} Console
              </p>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        {shellNav}

        {/* User Account / Circle Icon Footer */}
        <div className="p-3.5 border-t border-dark-border bg-dark-bg/50">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-dark-surface border border-dark-border hover:border-brand/30 transition-all">
            {/* Circle Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border-2 ${theme.border} ${theme.bg} ${theme.text}`}
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
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-dark-bg rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <CheckCircle2 className="w-3 h-3 text-brand shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {role} • Remembered
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-dark-surface border-b border-dark-border sticky top-0 z-40">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-dark-bg border border-brand/30 flex items-center justify-center text-brand">
            <Target className="h-4 w-4" />
          </div>
          <span className="font-black text-white uppercase text-base tracking-tight">Groundwork</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {/* Circular avatar on mobile topbar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${theme.border} ${theme.bg} ${theme.text}`}
          >
            <span>{getInitials(user?.name, user?.email)}</span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            title="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-dark-bg/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-white uppercase text-lg">Groundwork</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{role} Workspace</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl bg-white/5 text-white text-xs font-bold border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-3 p-3 mb-3 rounded-2xl bg-dark-surface border border-dark-border">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 ${theme.border} ${theme.bg} ${theme.text}`}
            >
              <span>{getInitials(user?.name, user?.email)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || user?.email}</p>
              <p className="text-[10px] text-brand capitalize font-bold">Active & Remembered</p>
            </div>
          </div>

          {shellNav}

          <div className="pt-4 border-t border-white/10 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Clear Active Session</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

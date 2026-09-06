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
  Sparkles,
  Share2,
  Video,
  Sliders,
  DollarSign,
  Lock,
  Activity,
  Heart,
  MessageSquare,
  Building2,
  Zap,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useToast } from '../../lib/toast';
import { useState } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
};

const navigation: NavItem[] = [
  // Common / Role Dashboards
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['player', 'guardian', 'club', 'admin'] },

  // Player Navigation
  { name: 'Opportunities', href: '/dashboard/opportunities', icon: Target, roles: ['player'] },
  { name: 'My Applications', href: '/dashboard/applications', icon: FileText, roles: ['player'] },
  { name: 'Video Clips', href: '/dashboard/videos', icon: Video, roles: ['player'] },
  { name: 'AI Suggestions', href: '/dashboard/recommendations', icon: Sparkles, roles: ['player'] },
  { name: 'Trials Invited', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['player'] },
  { name: 'Player Profile', href: '/dashboard/profile', icon: User, roles: ['player'] },
  { name: 'Pro & Boosts', href: '/dashboard/subscription', icon: Zap, roles: ['player'] },
  { name: 'Settings & Privacy', href: '/dashboard/settings', icon: Settings, roles: ['player'] },

  // Club Navigation
  { name: 'Search Players', href: '/dashboard/search', icon: Search, roles: ['club'] },
  { name: 'Club Invites & Code', href: '/dashboard/club/invites', icon: Share2, roles: ['club'] },
  { name: 'Squad Roster', href: '/dashboard/club/squad', icon: Users, roles: ['club'] },
  { name: 'AI Squad Gaps', href: '/dashboard/club/squad-gaps', icon: Sparkles, roles: ['club'] },
  { name: 'Shortlists', href: '/dashboard/shortlist', icon: Star, roles: ['club'] },
  { name: 'Applications', href: '/dashboard/applications', icon: FileText, roles: ['club'] },
  { name: 'Trials Manager', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['club'] },
  { name: 'Club Profile', href: '/dashboard/club/profile', icon: Building2, roles: ['club'] },
  { name: 'Club Verification', href: '/dashboard/club/verification', icon: ShieldCheck, roles: ['club'] },
  { name: 'Subscription & Boosts', href: '/dashboard/club/subscription', icon: Zap, roles: ['club'] },
  { name: 'Messages', href: '/dashboard/club/messages', icon: MessageSquare, roles: ['club'] },

  // Guardian Navigation
  { name: 'Youth Profile', href: '/dashboard/guardian/youth-profile', icon: User, roles: ['guardian'] },
  { name: 'Consent Center', href: '/dashboard/guardian/consent', icon: ShieldCheck, roles: ['guardian'] },
  { name: 'Consent Audit Trail', href: '/dashboard/guardian/consent-history', icon: FileText, roles: ['guardian'] },
  { name: 'Guardian Settings', href: '/dashboard/guardian/settings', icon: Settings, roles: ['guardian'] },

  // Admin Navigation
  { name: 'Users Management', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Clubs Verification', href: '/dashboard/admin/clubs', icon: Building2, roles: ['admin'] },
  { name: 'Players Directory', href: '/dashboard/admin/players', icon: Target, roles: ['admin'] },
  { name: 'Youth Safeguarding', href: '/dashboard/admin/youth-verification', icon: ShieldCheck, roles: ['admin'] },
  { name: 'Consent Audits', href: '/dashboard/admin/consent', icon: FileText, roles: ['admin'] },
  { name: 'Matching Config', href: '/dashboard/admin/matching-config', icon: Sliders, roles: ['admin'] },
  { name: 'AI Management', href: '/dashboard/admin/ai', icon: Sparkles, roles: ['admin'] },
  { name: 'Moderation Queue', href: '/dashboard/admin/moderation', icon: ShieldCheck, roles: ['admin'] },
  { name: 'Revenue & Stripe', href: '/dashboard/admin/payments', icon: DollarSign, roles: ['admin'] },
  { name: 'GDPR Requests', href: '/dashboard/admin/gdpr', icon: Lock, roles: ['admin'] },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'System Health', href: '/dashboard/admin/system-health', icon: Activity, roles: ['admin'] },
];

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

  const shellNav = (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {filteredNav.map((item) => (
        <NavLink
          key={`${item.name}-${item.href}`}
          to={item.href}
          end={item.href === '/dashboard'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-200 border',
              isActive || location.pathname === item.href
                ? 'bg-brand/12 text-brand border-brand/25 shadow-[0_0_0_1px_rgba(204,255,0,0.08)] font-bold'
                : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex w-72 bg-slate-950/75 backdrop-blur-xl border-r border-white/10 flex-col h-screen sticky top-0 shrink-0 shadow-2xl shadow-black/25">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_30px_rgba(204,255,0,0.18)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase text-white">Groundwork</h1>
              <p className="text-[11px] text-slate-400 tracking-[0.24em] uppercase">Football Recruitment OS</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
            <p className="text-xs font-bold text-white capitalize mt-0.5">{role} Workspace</p>
          </div>
        </div>

        {shellNav}

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || user?.email}</p>
              <p className="text-[10px] text-slate-400 capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-black text-white uppercase text-base tracking-tight">Groundwork</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              <span className="font-black text-white uppercase text-lg">Groundwork</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl bg-white/5 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
          {shellNav}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

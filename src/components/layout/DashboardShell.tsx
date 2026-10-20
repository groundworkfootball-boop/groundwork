import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Target,
  Users,
  CalendarCheck,
  User,
  Settings,
  ShieldCheck,
  KeyRound,
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
  X,
  CreditCard,
  FileCheck2,
  ChevronDown,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth, type Role } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { cn } from '../ui/cn';
import { Badge } from '../ui/Badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['player', 'guardian', 'club', 'admin'] },
    ],
  },
  {
    label: 'Player',
    items: [
      { name: 'Opportunities', href: '/dashboard/opportunities', icon: Target, roles: ['player'] },
      { name: 'Profile builder', href: '/dashboard/player/profile-builder', icon: Sparkles, roles: ['player'] },
      { name: 'My applications', href: '/dashboard/applications', icon: FileText, roles: ['player'] },
      { name: 'Video clips', href: '/dashboard/videos', icon: Video, roles: ['player'] },
      { name: 'AI suggestions', href: '/dashboard/recommendations', icon: Lightbulb, roles: ['player'], badge: 'AI' },
      { name: 'Trial invitations', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['player'] },
      { name: 'My profile', href: '/dashboard/profile', icon: User, roles: ['player'] },
      { name: 'Plan & boosts', href: '/dashboard/subscription', icon: Zap, roles: ['player'] },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['player'] },
    ],
  },
  {
    label: 'Guardian',
    items: [
      { name: 'Youth profile', href: '/dashboard/guardian/youth-profile', icon: User, roles: ['guardian'] },
      { name: 'Consent centre', href: '/dashboard/guardian/consent', icon: ShieldCheck, roles: ['guardian'], badge: 'Required' },
      { name: 'Consent history', href: '/dashboard/guardian/consent-history', icon: FileCheck2, roles: ['guardian'] },
      { name: 'Settings', href: '/dashboard/guardian/settings', icon: Settings, roles: ['guardian'] },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { name: 'Search players', href: '/dashboard/search', icon: Search, roles: ['club'] },
      { name: 'Shortlists', href: '/dashboard/shortlist', icon: Star, roles: ['club'] },
      { name: 'Applications', href: '/dashboard/applications', icon: FileText, roles: ['club'] },
      { name: 'Trials', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['club'] },
      { name: 'Squad roster', href: '/dashboard/club/squad', icon: Users, roles: ['club'] },
      { name: 'Squad gaps', href: '/dashboard/club/squad-gaps', icon: Lightbulb, roles: ['club'], badge: 'AI' },
      { name: 'Messages', href: '/dashboard/club/messages', icon: MessageSquare, roles: ['club'] },
      { name: 'Analytics', href: '/dashboard/club/analytics', icon: BarChart3, roles: ['club'] },
    ],
  },
  {
    label: 'Club account',
    items: [
      { name: 'Club profile', href: '/dashboard/club/profile', icon: Building2, roles: ['club'] },
      { name: 'Onboarding', href: '/dashboard/club/onboarding', icon: Sparkles, roles: ['club'] },
      { name: 'Verification', href: '/dashboard/club/verification', icon: ShieldCheck, roles: ['club'], badge: 'Verify' },
      { name: 'Invites & code', href: '/dashboard/club/invites', icon: Share2, roles: ['club'] },
      { name: 'Subscription', href: '/dashboard/club/subscription', icon: CreditCard, roles: ['club'] },
      { name: 'Boosts', href: '/dashboard/club/boosts', icon: Zap, roles: ['club'] },
      { name: 'Settings', href: '/dashboard/club/settings', icon: Settings, roles: ['club'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Admin dashboard', href: '/dashboard/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
      { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
      { name: 'Players', href: '/dashboard/admin/players', icon: Target, roles: ['admin'] },
      { name: 'Clubs', href: '/dashboard/admin/clubs', icon: Building2, roles: ['admin'] },
      { name: 'Youth verification', href: '/dashboard/admin/youth-verification', icon: ShieldCheck, roles: ['admin'] },
      { name: 'Consent audits', href: '/dashboard/admin/consent', icon: FileCheck2, roles: ['admin'] },
      { name: 'Matching config', href: '/dashboard/admin/matching-config', icon: Sliders, roles: ['admin'], badge: 'Pure' },
      { name: 'AI management', href: '/dashboard/admin/ai', icon: Lightbulb, roles: ['admin'] },
      { name: 'Moderation', href: '/dashboard/admin/moderation', icon: ShieldCheck, roles: ['admin'] },
      { name: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3, roles: ['admin'] },
      { name: 'Payments', href: '/dashboard/admin/payments', icon: DollarSign, roles: ['admin'] },
      { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: CreditCard, roles: ['admin'] },
      { name: 'GDPR requests', href: '/dashboard/admin/gdpr', icon: Lock, roles: ['admin'] },
      { name: 'Audit trail', href: '/dashboard/audit-logs', icon: FileText, roles: ['admin'] },
      { name: 'System health', href: '/dashboard/admin/system-health', icon: Activity, roles: ['admin'] },
      { name: 'Roles & permissions', href: '/dashboard/admin/roles', icon: KeyRound, roles: ['admin'] },
      { name: 'Platform settings', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

const ROLE_LABEL: Record<Role, string> = {
  player: 'Player',
  guardian: 'Guardian',
  club: 'Club',
  admin: 'Administrator',
};

export function DashboardShell() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const groups = useMemo(() => {
    if (!role) return [];
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    })).filter((group) => group.items.length > 0);
  }, [role]);

  const handleLogout = async () => {
    await logout();
    success('Signed out.');
    navigate('/login', { replace: true });
  };

  const initials = (user?.name ?? user?.email ?? 'G').slice(0, 1).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
            <Target className="h-4 w-4 text-brand" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[14px] font-bold tracking-tight text-white">GROUNDWORK</span>
            <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {role ? ROLE_LABEL[role] : 'Workspace'}
            </span>
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="gw-scrollbar-none flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href + item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                        isActive
                          ? 'bg-brand/[0.10] text-brand'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-500')} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                              isActive ? 'bg-brand/20 text-brand' : 'bg-white/[0.07] text-slate-500',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[12px] font-bold text-brand">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-white">{user?.name ?? 'Member'}</p>
            <p className="truncate text-[10.5px] text-slate-500">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-rose-400"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-ink-950 text-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.06] bg-ink-900/60 lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="gw-rise relative h-full w-[280px] border-r border-white/[0.08] bg-ink-900">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-950/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-slate-300">
              {role ? ROLE_LABEL[role] : ''} workspace
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <NavLink
              to={role === 'club' ? '/dashboard/club/notifications' : '/dashboard/notifications'}
              className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
            </NavLink>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-white/[0.06]"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
                  {initials}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} aria-hidden />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.10] bg-ink-850 shadow-lift"
                  >
                    <div className="border-b border-white/[0.07] px-3.5 py-3">
                      <p className="truncate text-[12.5px] font-medium text-white">{user?.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                      <div className="mt-2">
                        <Badge tone={role === 'admin' ? 'violet' : role === 'club' ? 'sky' : 'brand'}>
                          {role ? ROLE_LABEL[role] : 'Member'}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-1">
                      <NavLink
                        to="/"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-300 hover:bg-white/[0.06]"
                        role="menuitem"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Public site
                      </NavLink>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-rose-400 hover:bg-rose-500/10"
                        role="menuitem"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}




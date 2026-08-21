import { NavLink, useNavigate } from 'react-router-dom';
import { type ClassValue, clsx } from 'clsx';
import { useAuth, type Role } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Users,
  CalendarCheck,
  User,
  Settings,
  Shield,
  FileText,
  Star,
  LogOut,
  Search,
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
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['player', 'club', 'admin'] },
  { name: 'Opportunities', href: '/dashboard/opportunities', icon: Target, roles: ['player', 'club'] },
  { name: 'Applications', href: '/dashboard/applications', icon: FileText, roles: ['player', 'club'] },
  { name: 'Find Players', href: '/dashboard/opportunities', icon: Search, roles: ['club'] },
  { name: 'Shortlist', href: '/dashboard/shortlist', icon: Star, roles: ['club'] },
  { name: 'Trial Manager', href: '/dashboard/trial-manager', icon: CalendarCheck, roles: ['player', 'club'] },
  { name: 'Profile', href: '/dashboard/profile', icon: User, roles: ['player', 'club'] },
  // Admin
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'System Config', href: '/dashboard/system-config', icon: Settings, roles: ['admin'] },
];

export const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const filteredNav = navigation.filter((item) => role && item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    success('Signed out successfully.');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <h1 className="text-brand font-black text-2xl tracking-tighter uppercase">Groundwork</h1>
        <p className="text-xs text-text-secondary tracking-widest mt-1">Recruitment Command</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={`${item.name}-${item.href}`}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-dark-bg',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-dark-bg border border-brand/30 flex items-center justify-center text-brand shrink-0">
            {role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || user?.email || 'User'}</p>
            <p className="text-xs text-text-secondary capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 text-xs text-text-secondary hover:text-red-400 font-bold uppercase tracking-wider border border-dark-border hover:border-red-400/30 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

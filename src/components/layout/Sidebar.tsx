import { NavLink } from 'react-router-dom';
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
  FileText
} from 'lucide-react';

import { twMerge } from 'tailwind-merge';

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
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['player', 'club', 'admin'] },
  { name: 'Opportunities', href: '/opportunities', icon: Target, roles: ['player', 'club'] },
  { name: 'Shortlist', href: '/shortlist', icon: Users, roles: ['club'] },
  { name: 'Trial Manager', href: '/trial-manager', icon: CalendarCheck, roles: ['player', 'club'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'System Config', href: '/system-config', icon: Settings, roles: ['admin'] },
  { name: 'Profile', href: '/profile', icon: User, roles: ['player', 'club'] },
];

export const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const filteredNav = navigation.filter(item => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-brand font-black text-2xl tracking-tighter uppercase">Groundwork</h1>
        <p className="text-xs text-text-secondary tracking-widest mt-1">Recruitment Command</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-dark-bg text-brand border border-brand/20" 
                  : "text-text-secondary hover:text-text-primary hover:bg-dark-bg"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-dark-border">
        <div className="flex justify-between items-center mb-3">
           <button onClick={logout} className="text-xs text-text-secondary hover:text-brand font-bold uppercase tracking-wider">
             Sign Out
           </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-dark-bg border border-brand/30 flex items-center justify-center text-brand">
            {role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'Unknown'}</p>
            <p className="text-xs text-text-secondary capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

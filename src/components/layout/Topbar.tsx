import { useAuth } from '../../context/AuthContext';

export const Topbar = () => {
  const { role } = useAuth();

  return (
    <header className="h-16 bg-dark-bg/80 backdrop-blur-sm border-b border-dark-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-text-primary capitalize">{role || 'Guest'} View</h2>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Role:</span>
          <span className="bg-dark-surface border border-dark-border text-sm rounded-md text-text-primary px-3 py-1 capitalize">
            {role || 'Guest'}
          </span>
        </div>
        
        <span className="text-xs px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20 font-medium">
          {import.meta.env.VITE_APP_ENV || 'DEVELOPMENT'}
        </span>
      </div>
    </header>
  );
};

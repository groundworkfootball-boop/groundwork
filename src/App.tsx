import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar Skeleton */}
      <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-brand font-black text-2xl tracking-tighter uppercase">Groundwork</h1>
          <p className="text-xs text-text-secondary tracking-widest mt-1">Recruitment Command</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {['Dashboard', 'Opportunities', 'Shortlist', 'Trial Manager'].map((item) => (
            <a key={item} href="#" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md text-text-secondary hover:text-text-primary hover:bg-dark-bg transition-colors">
              <span>{item}</span>
            </a>
          ))}
        </nav>
        
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-dark-border"></div>
            <div>
              <p className="text-sm font-medium text-text-primary">Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-dark-bg/80 backdrop-blur-sm border-b border-dark-border flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-text-primary">Environment Setup Active</h2>
          <div className="flex items-center space-x-4">
            <span className="text-xs px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20">
              {import.meta.env.VITE_APP_ENV || 'DEVELOPMENT'}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-4xl">
            <h3 className="text-4xl font-bold mb-4 tracking-tight">MILESTONE 1 <span className="text-brand">READY</span></h3>
            <p className="text-text-secondary text-lg mb-8">
              The foundational architecture, security rules, CI/CD pipeline, and Firebase structure have been successfully established.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <h4 className="text-brand font-semibold mb-2">Security Foundation</h4>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li>• Deny-by-default rules implemented</li>
                  <li>• Immutable audit logging structure</li>
                  <li>• Separation of adult & youth data paths</li>
                </ul>
              </div>
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <h4 className="text-brand font-semibold mb-2">Infrastructure</h4>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li>• Firebase projects mapping configured</li>
                  <li>• GitHub Actions CI/CD ready</li>
                  <li>• Environment variables isolated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

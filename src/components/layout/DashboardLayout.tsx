import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex overflow-hidden groundwork-grid">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(204,255,0,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_25%)]" />
        <Topbar />
        
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

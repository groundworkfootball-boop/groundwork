import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

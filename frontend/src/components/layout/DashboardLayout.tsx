import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSites } from '../../hooks/useSites';
import { useIncomingRequests } from '../../hooks/useIncomingRequests';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sites } = useSites();
  const { requests: incomingRequests } = useIncomingRequests();

  // Try to parse user email or username from stored token or identity
  const userEmail = localStorage.getItem('user_email') || 'Engineer';

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        userEmail={userEmail}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle={true}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          siteCount={sites.length}
          pendingIncomingCount={pendingIncomingCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

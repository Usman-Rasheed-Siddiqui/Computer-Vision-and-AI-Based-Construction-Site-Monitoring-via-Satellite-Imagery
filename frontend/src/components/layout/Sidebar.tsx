import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Satellite,
  FileCheck2,
  Inbox,
  PlusCircle,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  siteCount?: number;
  pendingIncomingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  siteCount,
  pendingIncomingCount,
}) => {
  const mainNavigation = [
    {
      name: 'Overview Dashboard',
      to: '/dashboard',
      icon: Compass,
    },
    {
      name: 'Construction Sites',
      to: '/sites',
      icon: Satellite,
      badge: siteCount !== undefined ? siteCount : undefined,
    },
    {
      name: 'My Join Requests',
      to: '/my-join-requests',
      icon: FileCheck2,
    },
    {
      name: 'Incoming Access',
      to: '/access-requests',
      icon: Inbox,
      badge: pendingIncomingCount && pendingIncomingCount > 0 ? pendingIncomingCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-4">
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Site Operations
              </span>
              <div className="grid grid-cols-2 gap-2">
                <NavLink
                  to="/sites"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-300 text-xs font-medium transition-all group text-center"
                >
                  <PlusCircle className="w-4 h-4 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Register Site</span>
                </NavLink>
                <NavLink
                  to="/my-join-requests"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition-all group text-center"
                >
                  <KeyRound className="w-4 h-4 mb-1 text-slate-400 group-hover:scale-110 transition-transform" />
                  <span>Join by ID</span>
                </NavLink>
              </div>
            </div>

            {/* Navigation links */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-3">
                Navigation
              </span>
              <nav className="space-y-1">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Satellite Telemetry status indicator */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Pipeline Status
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Satellite multi-spectral & change masks processed via Django REST.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

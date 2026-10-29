import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../api/auth';
import {
  Satellite,
  Compass,
  FileCheck2,
  Inbox,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  userEmail?: string | null;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  onToggleSidebar,
  showSidebarToggle = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: Compass },
    { label: 'Sites', path: '/sites', icon: Satellite },
    { label: 'Join Requests', path: '/my-join-requests', icon: FileCheck2 },
    { label: 'Incoming Access', path: '/access-requests', icon: Inbox },
  ];

  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            {showSidebarToggle && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Satellite className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  OrbitWatch <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400">Satellite Construction Monitoring</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav for Logged In User */}
          {!isPublicPage && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {isPublicPage ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {userEmail && (
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-medium text-slate-200">{userEmail}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger toggle */}
            {!isPublicPage && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {!isPublicPage && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                    active ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

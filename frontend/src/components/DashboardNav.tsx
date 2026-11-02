import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { logout } from '../api/auth';

// ─── Fade-in animation wrapper (mirrors the one in Hero.tsx) ─────────────────
function Animate({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
}) {
  const directionClass = {
    up: 'animate-fade-up',
    down: 'animate-fade-down',
    left: 'animate-fade-left',
    right: 'animate-fade-right',
    scale: 'animate-fade-scale',
  }[direction];

  return (
    <div
      className={`opacity-0 ${directionClass} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Nav links config ─────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Construction Site', href: '/construction-site' },
  { label: 'Members & Requests', href: '/member-request' },
];

// ─── Shared Dashboard Navbar ──────────────────────────────────────────────────
export default function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout(); // clears access_token, refresh_token, user_username
    navigate('/signin');
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* ── Desktop nav bar ── */}
      <nav className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[30px] flex items-center justify-between relative z-50">

        {/* Logo */}
        <Animate delay={0} direction="down">
          <button
            onClick={() => navigate('/hero')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <svg width="28" height="28" viewBox="0 0 256 256" fill="none" className="sm:w-[32px] sm:h-[32px]">
              <path fill="white" d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z" />
            </svg>
            <span className="text-white text-[22px] sm:text-[26px] font-[450] leading-none tracking-[-0.02em]">
              SightLine
            </span>
          </button>
        </Animate>

        {/* Desktop centre links */}
        <Animate delay={100} direction="down" className="hidden lg:block">
          <div className="h-[52px] px-6 flex items-center gap-[30px] bg-[rgba(10,20,35,0.6)] border border-[#15803D]/20 rounded-[11px] backdrop-blur-[17px]">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={`text-[14px] font-[450] leading-[14px] transition-colors ${
                    isActive ? 'text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </Animate>

        {/* Desktop Log Out */}
        <Animate delay={200} direction="down" className="hidden lg:block">
          <div className="h-[52px] p-[3px] bg-[rgba(0,0,0,0.5)] rounded-[13px] backdrop-blur-[17px] flex items-center">
            <button
              onClick={handleLogout}
              className="h-[46px] px-6 bg-emerald-500 rounded-[11px] text-white text-[14px] font-[450] leading-[14px] hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Log Out
            </button>
          </div>
        </Animate>

        {/* Mobile hamburger */}
        <Animate delay={100} direction="down" className="lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="w-[44px] h-[44px] flex items-center justify-center rounded-[11px] bg-[rgba(10,20,35,0.6)] border border-[#15803D]/20 backdrop-blur-[17px] transition-colors hover:bg-white/10"
          >
            <div className="relative w-5 h-5">
              <Menu className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${isOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
            </div>
          </button>
        </Animate>
      </nav>

      {/* ── Mobile drawer ── */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-[#080A19]/90 backdrop-blur-[24px] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer panel */}
        <div className={`absolute top-[76px] sm:top-[86px] left-4 right-4 sm:left-6 sm:right-6 bg-[rgba(10,20,35,0.8)] backdrop-blur-[30px] rounded-[20px] border border-[#15803D]/20 p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-top ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-[0.97]'}`}>

          {/* Nav links */}
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={`flex items-center justify-between px-4 py-4 rounded-[12px] text-[18px] font-[450] hover:bg-white/[0.06] transition-all duration-300 text-left w-full ${
                    isActive ? 'text-white bg-white/[0.04]' : 'text-white/90'
                  } ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
                  style={{ transitionDelay: isOpen ? `${100 + i * 50}ms` : '0ms' }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-white/10 my-5" />

          {/* CTA buttons */}
          <div
            className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ transitionDelay: isOpen ? '250ms' : '0ms' }}
          >
            <button
              onClick={() => navigate('/hero')}
              className="w-full h-[50px] bg-[#15803D] rounded-[12px] text-white text-[15px] font-[450] transition-colors hover:bg-[#166534]"
            >
              View Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full h-[50px] rounded-[12px] bg-emerald-500 text-white text-[15px] font-[450] transition-colors hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

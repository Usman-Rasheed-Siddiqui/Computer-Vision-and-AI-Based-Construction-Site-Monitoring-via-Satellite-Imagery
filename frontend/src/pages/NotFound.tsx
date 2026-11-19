import { Link } from 'react-router-dom';
import { ArrowRight, Home, LayoutGrid } from 'lucide-react';

const cards = [
  {
    to: '/',
    title: 'Landing Page',
    subtitle: 'Back where it all begins…',
    icon: Home,
  },
  {
    to: '/construction-site/member',
    title: 'My Sites',
    subtitle: 'Pick up where you left off',
    icon: LayoutGrid,
  },
];

export default function NotFound() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-sky-100 via-white to-emerald-100 font-sans text-slate-900">
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      {/* soft glows + faint site grid */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-sky-300/40 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[460px] w-[460px] rounded-full bg-emerald-300/40 blur-[120px]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden="true">
        <defs>
          <pattern id="nf-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#94a3b8" strokeOpacity="0.25" strokeWidth="1" />
          </pattern>
          <radialGradient id="nf-fade" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="nf-mask">
            <rect width="100%" height="100%" fill="url(#nf-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#nf-grid)" mask="url(#nf-mask)" />
      </svg>

      {/* header */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Sightline<span className="text-emerald-600">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <Link to="/features" className="transition-colors hover:text-slate-900">Features</Link>
          <Link to="/faq" className="transition-colors hover:text-slate-900">FAQ</Link>
        </nav>
      </header>

      {/* content */}
      <main className="relative z-10 mx-auto flex w-full max-w-[700px] flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
          Error 404
        </span>

        <p className="mb-3 text-[15px] text-slate-500">Seems you've wandered off the map…</p>

        <div className="relative mb-4 inline-block">
          {/* cloud decoration */}
          <svg
            viewBox="0 0 24 24"
            className="float-slow absolute -left-2 -top-[18px] md:-left-6 h-9 w-9 md:h-11 md:w-11"
            style={{
              animation: 'floatSlow 5s ease-in-out 0.3s infinite',
              filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 1px #fff)',
            }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nf-cloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="45%" stopColor="#7dd3fc" />
                <stop offset="80%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path
              fill="url(#nf-cloud)"
              d="M6.5 19a4.5 4.5 0 0 1-.42-8.98A6 6 0 0 1 17.7 8.6 4.7 4.7 0 0 1 17.5 19Z"
            />
          </svg>

          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.08] tracking-[-0.03em] text-slate-900">
            Whoops! Nothing here yet
          </h1>
        </div>

        <p className="mb-9 max-w-[470px] text-sm leading-[1.7] text-slate-500">
          The page you're looking for doesn't exist or has moved. Head back to the{' '}
          <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-[12.5px] font-semibold text-sky-800">landing page</span>{' '}
          or open your{' '}
          <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[12.5px] font-semibold text-emerald-800">sites</span>{' '}
          to keep monitoring.
        </p>

        <div className="flex w-full max-w-[460px] flex-col gap-3 text-left">
          {cards.map(({ to, title, subtitle, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center justify-between rounded-[18px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_2px_12px_rgba(15,60,90,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_28px_rgba(15,60,90,0.12)]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 text-blue-700 transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[15px] font-semibold">{title}</div>
                  <div className="text-xs text-slate-500">{subtitle}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-emerald-600" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
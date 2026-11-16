import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

const nav = [
  { to: '/features', label: 'Features' },
  { to: '/faq', label: 'FAQ' },
];

/** Shared light blue → green frame for the public Features and FAQ pages. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-white to-emerald-100 text-slate-900 font-sans">
      <div className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-sky-300/40 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 h-[460px] w-[460px] rounded-full bg-emerald-300/40 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
          Sightline<span className="text-emerald-600">.</span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-white/70 bg-white/60 p-1 shadow-sm backdrop-blur-xl">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <Link
            to="/signin"
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mx-auto mt-24 max-w-6xl border-t border-slate-200/80 px-6 py-8 text-sm text-slate-500">
        © 2026 Sightline Monitoring. All rights reserved.
      </footer>
    </div>
  );
}
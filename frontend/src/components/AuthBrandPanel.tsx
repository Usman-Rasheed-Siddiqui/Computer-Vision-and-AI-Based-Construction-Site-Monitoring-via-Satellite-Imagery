type Props = {
  headline: string;
  text: string;
  cardTitle: string;
  items: string[];
};

/** Left-hand brand panel shared by the Sign in and Sign up pages. */
export default function AuthBrandPanel({ headline, text, cardTitle, items }: Props) {
  return (
    <aside className="hidden lg:flex relative flex-col justify-between w-[41%] min-h-screen p-8 lg:p-12 overflow-hidden bg-[#080A19] text-white">
      {/* background: blue/green glows + site grid */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-blue-600/25 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[460px] w-[460px] rounded-full bg-emerald-500/25 blur-[120px]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" aria-hidden="true">
        <defs>
          <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#334155" strokeOpacity="0.45" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
        <rect x="62%" y="58%" width="110" height="80" fill="#34d3991f" stroke="#34d399" strokeOpacity="0.5" />
        <rect x="70%" y="22%" width="80" height="56" fill="#60a5fa1f" stroke="#60a5fa" strokeOpacity="0.5" />
      </svg>

      <div className="relative z-10 flex items-center gap-3">
        <img src="/logo.png" alt="Sightline logo" className="h-11 w-11 object-contain" />
        <span className="text-xl font-bold tracking-tight">Sightline.</span>
      </div>

      <div className="relative z-10 my-auto max-w-sm">
        <h2 className="text-4xl font-semibold tracking-tight leading-tight text-gray-100">{headline}</h2>
        <p className="mt-4 text-sm text-white/60 leading-relaxed">{text}</p>

        <div className="mt-8 p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">{cardTitle}</p>
          <ul className="mt-3 space-y-2.5">
            {items.map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-xs leading-relaxed text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-[10px] font-bold">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 text-xs text-white/40">
        © 2026 Sightline Monitoring. All rights reserved.
      </div>
    </aside>
  );
}
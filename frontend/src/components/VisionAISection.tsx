import { Link } from 'react-router-dom';
import { ArrowRight, ScanSearch, FileText, BarChart3 } from 'lucide-react';
import Reveal from './Reveal';

const steps = [
  {
    icon: ScanSearch,
    title: 'Compares two dates',
    text: 'Pick any two satellite captures of your site. Computer vision aligns them and isolates what changed.',
  },
  {
    icon: BarChart3,
    title: 'Measures the change',
    text: 'Changed regions are quantified and charted, so progress becomes a number you can track over time.',
  },
  {
    icon: FileText,
    title: 'Explains it in words',
    text: 'An AI summary describes the findings in plain language, ready to export as a PDF report.',
  },
];

/* Illustrative before / after tiles with a change mask — decorative, not real data. */
function Tile({ label, mask }: { label: string; mask?: boolean }) {
  const pid = mask ? 'grid-after' : 'grid-before';
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <svg viewBox="0 0 160 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id={pid} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="#1e293b" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="160" height="120" fill="#0b1220" />
        <rect width="160" height="120" fill={`url(#${pid})`} />
        <rect x="14" y="70" width="46" height="34" fill="#1e293b" />
        <rect x="72" y="28" width="30" height="24" fill="#1e293b" />
        {mask && (
          <>
            <rect x="108" y="64" width="36" height="34" fill="#34d39933" stroke="#34d399" strokeWidth="1.2" />
            <rect x="20" y="30" width="34" height="22" fill="#60a5fa33" stroke="#60a5fa" strokeWidth="1.2" />
          </>
        )}
        {!mask && <rect x="108" y="64" width="36" height="34" fill="#1e293b" opacity=".5" />}
      </svg>
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-300">
        {label}
      </span>
    </div>
  );
}

export default function VisionAISection() {
  return (
    <section id="ai" className="relative bg-slate-950 text-white py-24 md:py-32 px-6 scroll-mt-4 overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative max-w-6xl mx-auto grid gap-14 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">02 // Vision AI</p>
          <h2 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.02]">
            Let the model read the{' '}
            <span className="font-['Instrument_Serif'] italic font-normal text-emerald-400">site</span>
            , so you don't have to.
          </h2>
          <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-xl">
            Sightline pairs computer-vision change detection with an AI analyst. It finds what changed
            between captures and explains the progress in language anyone on the project can follow.
          </p>

          <ul className="mt-10 space-y-6">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/construction-site/member"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Try it on your site <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={150}>
          <div className="rounded-[28px] bg-slate-900/60 border border-slate-800 backdrop-blur-md p-5 md:p-6">
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Before" />
              <Tile label="After + mask" mask />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-black/50 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> AI summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                New built-up area detected in the south-east plot and cleared ground in the north-west
                corner since the earlier capture.
              </p>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-600">Illustrative example, not live data.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
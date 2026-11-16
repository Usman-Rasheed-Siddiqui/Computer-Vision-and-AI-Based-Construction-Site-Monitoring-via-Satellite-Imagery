import { Link } from 'react-router-dom';
import { ArrowRight, ScanSearch, BarChart3, FileText } from 'lucide-react';
import PageShell from '../components/PageShell';
import Reveal from '../components/Reveal';

/* Glowing wireframe "hologram" icons: strokes + soft coloured glow. */
const tones = { blue: '#2563eb', green: '#059669' };

function Holo({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  const c = tones[tone];
  return (
    <div className="relative flex h-36 w-full items-center justify-center mix-blend-multiply" aria-hidden="true">
      <div className="absolute h-24 w-24 rounded-full opacity-30 blur-2xl" style={{ background: c }} />
      <svg
        viewBox="0 0 120 120"
        className="relative h-32 w-32"
        fill="none"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${c}88) drop-shadow(0 0 12px ${c}55)` }}
      >
        {children}
      </svg>
    </div>
  );
}

const DetectIcon = () => (
  <Holo tone="blue">
    <path d="M60 18 100 38 60 58 20 38Z" />
    <path d="M20 54 60 74 100 54" opacity=".7" />
    <path d="M20 70 60 90 100 70" opacity=".45" />
    <path d="M40 28 80 48M80 28 40 48" opacity=".35" />
    <path d="M60 33 74 40 60 47 46 40Z" fill="#2563eb33" />
    <circle cx="60" cy="40" r="2" fill="#2563eb" />
  </Holo>
);
const InsightIcon = () => (
  <Holo tone="green">
    <circle cx="60" cy="60" r="34" opacity=".5" />
    <circle cx="60" cy="60" r="20" />
    <circle cx="60" cy="60" r="4" fill="#059669" />
    <path d="M60 26V40M60 80V94M26 60H40M80 60H94" opacity=".7" />
    <path d="M36 36 46 46M84 36 74 46M36 84 46 74M84 84 74 74" opacity=".4" />
    <circle cx="36" cy="36" r="2.5" fill="#059669" />
    <circle cx="84" cy="84" r="2.5" fill="#059669" />
  </Holo>
);
const ControlIcon = () => (
  <Holo tone="blue">
    <path d="M60 16 92 28V58C92 78 78 92 60 102 42 92 28 78 28 58V28Z" />
    <path d="M44 52H76M44 64H76M44 76H64" opacity=".7" />
    <path d="M52 40 58 46 70 34" stroke="#059669" />
  </Holo>
);

const cards = [
  {
    index: '01',
    title: 'Detect change',
    body: 'Register a site by its bounding coordinates, confirm it on the map, and compare satellite images from different dates. Sightline generates a change mask showing what was built, cleared or altered.',
    points: ['Map-confirmed site registration', 'Date-to-date image comparison', 'Visual change masks'],
    icon: <DetectIcon />,
    dot: 'bg-blue-600',
  },
  {
    index: '02',
    title: 'Understand progress',
    body: 'Detected changes become plain-language summaries and charts, so owners and stakeholders can read progress without interpreting raw imagery.',
    points: ['AI-written progress summaries', 'Progress charts per comparison', 'Latest-vs-previous snapshot'],
    icon: <InsightIcon />,
    dot: 'bg-emerald-600',
  },
  {
    index: '03',
    title: 'Control access & report',
    body: 'Site owners decide who can see a site. Members request access with a Site ID, owners approve or reject, and monitoring reports download as PDFs.',
    points: ['Request access by Site ID', 'Owner approve / reject', 'Downloadable PDF reports'],
    icon: <ControlIcon />,
    dot: 'bg-blue-600',
  },
];

const aiSteps = [
  { icon: ScanSearch, title: 'Compares two dates', text: 'Pick any two satellite captures. Computer vision aligns them and isolates what changed.' },
  { icon: BarChart3, title: 'Measures the change', text: 'Changed regions are quantified and charted so progress becomes a trackable number.' },
  { icon: FileText, title: 'Explains it in words', text: 'An AI summary describes the findings in plain language, ready to export as a PDF.' },
];

const glass = 'rounded-[24px] border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(15,60,90,0.08)] backdrop-blur-xl';

export default function FeaturesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 pt-10 md:pt-16">
        <Reveal>
          <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tighter md:text-7xl">
            Clarity across every{' '}
            <span
              className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 16px rgba(5,150,105,0.35))' }}
            >
              layer
            </span>
            .
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            From the first registered coordinate to the final report, Sightline keeps a construction site
            visible, measurable and shareable.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <article className={`${glass} h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(15,60,90,0.14)]`}>
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span className="text-blue-600">{c.index}</span>
                  <span className="uppercase tracking-widest">Sightline</span>
                </div>
                <div className="mt-4 rounded-2xl border border-white/80 bg-gradient-to-br from-sky-50 to-emerald-50">{c.icon}</div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight">{c.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{c.body}</p>
                <ul className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-5">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-slate-700">
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Vision AI */}
      <section id="ai" className="mx-auto mt-28 max-w-6xl scroll-mt-6 px-6">
        <Reveal>
          <div className={`${glass} grid gap-10 p-8 md:p-12 lg:grid-cols-2 lg:items-center`}>
            <div>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tighter md:text-5xl">
                Let the model read the{' '}
                <span className="font-['Instrument_Serif'] font-normal italic text-blue-600">site</span>.
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Computer-vision change detection paired with an AI analyst: it finds what changed between
                captures and explains the progress in language anyone on the project can follow.
              </p>
              <Link
                to="/construction-site/member"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Try it on your site <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="space-y-6">
              {aiSteps.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
import { useMemo, useState } from 'react';
import { Search, Rocket, MapPinned, Sparkles, FileText, Plus, X } from 'lucide-react';
import PageShell from '../components/PageShell';
import Reveal from '../components/Reveal';

type Category = 'Getting started' | 'Sites & access' | 'Analysis & AI' | 'Reports';

const categories: { name: Category; icon: typeof Rocket; blurb: string }[] = [
  { name: 'Getting started', icon: Rocket, blurb: 'Accounts and first steps' },
  { name: 'Sites & access', icon: MapPinned, blurb: 'Register and share sites' },
  { name: 'Analysis & AI', icon: Sparkles, blurb: 'Detection and summaries' },
  { name: 'Reports', icon: FileText, blurb: 'Progress and exports' },
];

const faqs: { q: string; a: string; cat: Category }[] = [
  { cat: 'Getting started', q: 'How do I get started with Sightline?', a: 'Create an account, sign in, and register your first construction site. Once it is registered you can view its satellite imagery, run comparisons and generate reports.' },
  { cat: 'Getting started', q: 'What can I do from my dashboard?', a: 'The dashboard lists every site you own or have been granted access to. From there you can open a site, review its progress charts, run AI analysis and manage access requests.' },
  { cat: 'Getting started', q: 'Can I update my account details?', a: 'Yes. You can manage your account information after signing in. Your sites and records stay linked to your account.' },
  { cat: 'Sites & access', q: 'How do I register a construction site?', a: 'Enter the site details and its bounding-box coordinates, then confirm the area on the map before saving. Confirming on the map makes sure the imagery you monitor covers the right location.' },
  { cat: 'Sites & access', q: 'How do I get access to someone else’s site?', a: 'Enter the Site ID and press check to confirm the site name and location, then send a request. The site owner receives it and can approve or reject it.' },
  { cat: 'Sites & access', q: 'Who can approve or reject access requests?', a: 'Only the creator of the site. Approved users can view the site and its analysis; rejected requests do not grant any access.' },
  { cat: 'Analysis & AI', q: 'How does change detection work?', a: 'Sightline compares satellite images captured on two different dates and produces a change mask highlighting the areas that differ, such as new structures or cleared land.' },
  { cat: 'Analysis & AI', q: 'What does the AI analysis give me?', a: 'An AI-generated summary of the detected changes in plain language, along with charts that put the progress into numbers. It supports your judgement; it does not replace a site inspection.' },
  { cat: 'Analysis & AI', q: 'Can I compare any two dates?', a: 'You can choose the dates you want to compare for a site, or view the latest comparison to see the most recent progress at a glance.' },
  { cat: 'Reports', q: 'How do I see a site’s progress over time?', a: 'Open the site to view its progress charts and comparison table, which shows which earlier and later dates each comparison used.' },
  { cat: 'Reports', q: 'Can I download a monitoring report?', a: 'Yes. A monitoring report with the analysis, charts and summary can be generated and downloaded as a PDF to share with your team.' },
  { cat: 'Reports', q: 'What happens if something goes wrong?', a: 'Sightline shows a clear error notification when an action fails, for example when a site cannot be found or an analysis cannot be completed, so you know what to retry.' },
];

const glass = 'border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(15,60,90,0.08)] backdrop-blur-xl';

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Category | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) => (!active || f.cat === active) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  }, [query, active]);

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-6 pt-10 md:pt-16">
        <Reveal className="text-center">
          <span className="inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-emerald-700">
            FAQ
          </span>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-tighter md:text-7xl">
            Questions, <span className="font-['Instrument_Serif'] font-normal italic text-blue-600">answered</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            Everything you need to know about monitoring a site with Sightline.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className={`${glass} mt-10 flex items-center gap-3 rounded-full px-5 py-3.5 transition-colors focus-within:border-blue-500/60`}>
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
              placeholder="Search questions…"
              aria-label="Search FAQ"
              className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className="text-slate-400 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map(({ name, icon: Icon, blurb }) => {
              const on = active === name;
              return (
                <button
                  key={name}
                  onClick={() => { setActive(on ? null : name); setOpen(null); }}
                  aria-pressed={on}
                  className={`rounded-[20px] border p-4 text-left transition-all duration-300 ${
                    on ? 'border-emerald-600/50 bg-emerald-500/15' : `${glass} hover:-translate-y-0.5`
                  }`}
                >
                  <Icon className={`h-5 w-5 ${on ? 'text-emerald-700' : 'text-blue-600'}`} />
                  <div className="mt-3 text-sm font-semibold">{name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{blurb}</div>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mt-8 space-y-3">
          {visible.length === 0 && (
            <p className={`${glass} rounded-2xl p-8 text-center text-slate-500`}>No questions match your search.</p>
          )}
          {visible.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`${glass} rounded-[22px] transition-colors duration-300 ${isOpen ? 'border-blue-500/40 bg-white/80' : ''}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-medium md:text-lg">{f.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen ? 'rotate-45 border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 leading-relaxed text-slate-600">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
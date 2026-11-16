import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  RefreshCw,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Eye,
  Lightbulb,
  ShieldAlert,
  ClipboardList,
  Layers,
  Activity,
  Maximize2,
  CalendarRange,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import api from '../../api/axios';
import DashboardNav from '../../components/DashboardNav';
import ThoughtLine from '../../components/ThoughtLine';
import {
  buildAnalysisPdf,
  analysisPdfFileName,
  formatArea,
  formatDate,
  formatDays,
  formatPercent,
} from './aiAnalysisReport';
import type { AIAnalysisResponse, ChartPoint } from './aiAnalysisReport';
import './AIAnalysis.css';

// ---------------------------------------------------------------------------
// SMALL BUILDING BLOCKS
// Defined outside the page component so they are not re-created (and their
// entrance animation replayed) every time the page state changes.
// ---------------------------------------------------------------------------

const CHANGE_COLOR = '#34d399';
const PACE_COLOR = '#38bdf8';
const AXIS_TEXT = '#7c879b';
const GRID_LINE = 'rgba(148, 163, 184, 0.12)';

function ReportSection({
  title,
  icon,
  children,
  delay,
  className = '',
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <section
      className={`ai-report-card ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="ai-report-icon">{icon}</div>
        <h2 className="text-white text-lg font-semibold">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) {
    return <p className="text-slate-500 text-sm">No information available.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-slate-300 text-sm leading-7">
          <span className="ai-bullet" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  delay: number;
}) {
  return (
    <div className="ai-stat-tile" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
        <span className="text-emerald-400">{icon}</span>
        {label}
      </div>
      <p className="text-white text-3xl font-semibold mt-3 tabular-nums">
        {value}
      </p>
      <p className="text-slate-500 text-xs mt-1.5">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  delay,
  className = '',
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <section
      className={`ai-chart-card ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-white text-base font-semibold">{title}</h3>
      <p className="text-slate-400 text-xs mt-1 mb-5 leading-5">{subtitle}</p>
      {children}
    </section>
  );
}

// Tooltip shared by both charts. Recharts passes `active` and `payload`.
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const point: ChartPoint = payload[0].payload;

  return (
    <div className="ai-tooltip">
      <p className="ai-tooltip-title">
        {formatDate(point.earlier_date)} to {formatDate(point.later_date)}
      </p>
      <dl>
        <div>
          <dt>Change detected</dt>
          <dd>{formatPercent(point.change_percentage)}</dd>
        </div>
        <div>
          <dt>Area changed</dt>
          <dd>{formatArea(point.area_changed_sqm)}</dd>
        </div>
        <div>
          <dt>Period length</dt>
          <dd>{formatDays(point.period_days)}</dd>
        </div>
        {point.area_per_day_sqm !== null && (
          <div>
            <dt>Average pace</dt>
            <dd>{formatArea(point.area_per_day_sqm)} / day</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// Horizontal bars showing which dates each analysis compared.
function PeriodTimeline({ points }: { points: ChartPoint[] }) {
  const rows = points
    .filter((p) => p.earlier_date && p.later_date)
    .slice(-12);

  if (!rows.length) {
    return <p className="text-slate-500 text-sm">No dated records available.</p>;
  }

  const toTime = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();

  const start = Math.min(...rows.map((p) => toTime(p.earlier_date as string)));
  const end = Math.max(...rows.map((p) => toTime(p.later_date as string)));
  const span = Math.max(end - start, 1);

  return (
    <div>
      <div className="space-y-2.5">
        {rows.map((p) => {
          const left = ((toTime(p.earlier_date as string) - start) / span) * 100;
          const width = Math.max(
            ((toTime(p.later_date as string) - toTime(p.earlier_date as string)) / span) * 100,
            1.5
          );

          return (
            <div key={p.progress_id} className="ai-timeline-row">
              <span className="ai-timeline-label">#{p.index}</span>

              <div
                className="ai-timeline-track"
                title={`${formatDate(p.earlier_date)} to ${formatDate(p.later_date)} · ${formatPercent(p.change_percentage)} change`}
              >
                <div
                  className="ai-timeline-bar"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>

              <span className="ai-timeline-value">
                {formatPercent(p.change_percentage)}
                <span className="text-slate-500 font-normal">
                  {' '}· {formatDays(p.period_days)}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="ai-timeline-axis">
        <span>{formatDate(new Date(start).toISOString())}</span>
        <span>{formatDate(new Date(end).toISOString())}</span>
      </div>

      {points.length > rows.length && (
        <p className="text-slate-500 text-xs mt-3">
          Showing the {rows.length} most recent analyses.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

function AIAnalysis() {
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Prevent duplicate requests during React StrictMode's development effect cycle.
  const requestedSiteId = useRef('');

  const generateAnalysis = useCallback(
    async (force = false) => {
      if (!id) {
        setError('Construction site ID is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setReport(null);

      try {
        const response = await api.post<AIAnalysisResponse>(
          `sites/${id}/ai-analysis/generate/`,
          { force },
          // Backend answers within ~30s; stop waiting shortly after that.
          { timeout: 45000 }
        );

        setReport(response.data);
      } catch (err: any) {
        console.error('AI Analysis error:', err);

        const responseData = err.response?.data;

        const errorMessage =
          responseData?.detail ||
          responseData?.error ||
          responseData?.message ||
          (typeof responseData === 'string' ? responseData : '') ||
          'Unable to generate the AI analysis. Please try again.';

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (requestedSiteId.current !== id) {
      requestedSiteId.current = id || '';
      generateAnalysis();
    }
  }, [id, generateAnalysis]);

  const downloadPDF = () => {
    if (!report) return;

    setDownloading(true);

    try {
      buildAnalysisPdf(report).save(analysisPdfFileName(report.site_name));
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Unable to generate the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ---- Chart data ---------------------------------------------------------

  const points = report?.chart_points ?? [];
  const stats = report?.stats;
  const analysis = report?.analysis ?? null;

  const changePoints = useMemo(
    () => points.filter((p) => p.change_percentage !== null),
    [points]
  );

  const pacePoints = useMemo(
    () => points.filter((p) => p.area_per_day_sqm !== null),
    [points]
  );

  const dateTick = (list: ChartPoint[]) => (index: number) => {
    const point = list.find((p) => p.index === index);
    return point ? formatDate(point.later_date, false) : '';
  };

  const latestPercent = Math.min(
    Math.max(stats?.latest?.change_percentage ?? 0, 0),
    100
  );

  // ---- Render -------------------------------------------------------------

  return (
    <section className="min-h-screen bg-[#080A19] text-slate-100 font-sans">
      <div className="min-h-screen flex flex-col">
        <DashboardNav />

        <main className="flex-1 w-full max-w-[1500px] mx-auto px-5 sm:px-8 md:px-[82px] py-10 sm:py-14">

          {/* PAGE HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <Link
                to={`/construction-site/member/${id}`}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft size={16} />
                Back to Site Details
              </Link>

              <div className="flex items-center gap-3 mb-3">
                <Bot size={20} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.2em]">
                  Gemini Intelligence
                </span>
              </div>

              <h1 className="text-white text-3xl sm:text-5xl font-normal">
                AI Site Analysis
              </h1>

              <p className="text-slate-400 text-sm mt-3 max-w-xl">
                Your site's satellite monitoring history, shown as charts and
                explained in plain language.
              </p>
            </div>

            {report && !loading && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => generateAnalysis(true)}
                  className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/25 text-slate-200 px-5 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw size={16} />
                  Regenerate
                </button>

                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  <Download size={17} />
                  {downloading ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              </div>
            )}
          </div>

          {/* LOADING STATE */}

          {loading && (
            <div className="ai-loading-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Bot size={23} className="text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-white font-semibold">
                    Analysing construction progress
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    This usually takes less than half a minute.
                  </p>
                </div>
              </div>

              <ThoughtLine
                working={true}
                steps={[
                  'Collecting your progress records',
                  'Preparing charts and key numbers',
                  'Asking Gemini to write the summary',
                ]}
                label="Generating your AI report…"
                doneLabel="Analysis completed"
                glyph="sparkle"
                color="#A7F3D0"
                glyphColor="#34D399"
                fontSize={15}
                breathPeriod={1.6}
                settleDuration={350}
                collapsible
                collapseOnSettle
                showTimer
              />
            </div>
          )}

          {/* ERROR STATE */}

          {!loading && error && !report && (
            <div className="ai-error-card">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="text-red-400" size={22} />
                </div>

                <div className="flex-1">
                  <h2 className="text-white font-semibold text-lg">
                    Unable to generate analysis
                  </h2>

                  <p className="text-slate-400 text-sm mt-2 leading-7">{error}</p>

                  <p className="text-slate-500 text-xs mt-3 leading-6">
                    Make sure that you have completed at least one successful
                    site monitoring analysis and then try again.
                  </p>

                  <button
                    onClick={() => generateAnalysis()}
                    className="mt-6 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REPORT */}

          {!loading && report && stats && (
            <div key={report.site_id} className="ai-report-container">

              {error && (
                <p className="text-red-400 text-sm mb-5" role="alert">{error}</p>
              )}

              {/* OVERVIEW */}

              <div className="ai-report-overview mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-2">
                      <CheckCircle2 size={15} />
                      {report.cached ? 'Saved Analysis' : 'Analysis Generated'}
                    </div>

                    <h2 className="text-white text-2xl font-medium">
                      {report.site_name}
                    </h2>

                    <p className="text-slate-500 text-xs mt-2">
                      {stats.first_image_date && stats.last_image_date && (
                        <>
                          Satellite images from {formatDate(stats.first_image_date)}{' '}
                          to {formatDate(stats.last_image_date)}
                        </>
                      )}
                      {report.generated_at && (
                        <>
                          {' '}· Written {new Date(report.generated_at).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* KEY NUMBERS */}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <StatTile
                  icon={<Layers size={15} />}
                  label="Analyses run"
                  value={String(stats.total_analyses)}
                  hint="completed comparisons"
                  delay={60}
                />
                <StatTile
                  icon={<Activity size={15} />}
                  label="Latest change"
                  value={formatPercent(stats.latest?.change_percentage)}
                  hint={stats.latest ? `image of ${formatDate(stats.latest.later_date)}` : ''}
                  delay={120}
                />
                <StatTile
                  icon={<Maximize2 size={15} />}
                  label="Largest change"
                  value={formatPercent(stats.peak?.change_percentage)}
                  hint={stats.peak ? `image of ${formatDate(stats.peak.later_date)}` : ''}
                  delay={180}
                />
                <StatTile
                  icon={<CalendarRange size={15} />}
                  label="Monitoring period"
                  value={formatDays(stats.monitoring_days)}
                  hint="first to last satellite image"
                  delay={240}
                />
              </div>

              {/* LATEST SNAPSHOT METER */}

              {stats.latest && (
                <div className="ai-chart-card mb-5" style={{ animationDelay: '280ms' }}>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-white text-base font-semibold">
                        Latest snapshot
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        {formatDate(stats.latest.earlier_date)} compared with{' '}
                        {formatDate(stats.latest.later_date)}
                      </p>
                    </div>

                    <p className="text-slate-300 text-sm">
                      <span className="text-white font-semibold">
                        {formatArea(stats.latest.area_changed_sqm)}
                      </span>{' '}
                      changed
                      {stats.monitored_area_sqm !== null && (
                        <> out of {formatArea(stats.monitored_area_sqm)} monitored</>
                      )}
                    </p>
                  </div>

                  <div
                    className="ai-meter"
                    role="img"
                    aria-label={`${formatPercent(stats.latest.change_percentage)} of the monitored area changed`}
                  >
                    <div
                      className="ai-meter-fill"
                      style={{ width: `${Math.max(latestPercent, 0.8)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>
                      <span className="text-emerald-400 font-semibold">
                        {formatPercent(stats.latest.change_percentage)}
                      </span>{' '}
                      looked different
                    </span>
                    <span>{formatPercent(100 - latestPercent)} looked the same</span>
                  </div>
                </div>
              )}

              {/* CHARTS */}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
                <ChartCard
                  title="Change detected in each analysis"
                  subtitle="How much of the monitored area looked different between the two satellite images (%)."
                  delay={340}
                >
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={changePoints}
                        margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid stroke={GRID_LINE} vertical={false} />
                        <XAxis
                          dataKey="index"
                          tickFormatter={dateTick(changePoints)}
                          tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: GRID_LINE }}
                          minTickGap={18}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `${v}%`}
                          tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={52}
                        />
                        <Tooltip
                          content={<ChartTooltip />}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        />
                        <Bar
                          dataKey="change_percentage"
                          fill={CHANGE_COLOR}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={44}
                          animationDuration={700}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Pace of change"
                  subtitle="Average area changed per day of each compared period (m² per day). Makes short and long periods comparable."
                  delay={420}
                >
                  {pacePoints.length ? (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={pacePoints}
                          margin={{ top: 8, right: 14, bottom: 0, left: -8 }}
                        >
                          <CartesianGrid stroke={GRID_LINE} vertical={false} />
                          <XAxis
                            dataKey="index"
                            tickFormatter={dateTick(pacePoints)}
                            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: GRID_LINE }}
                            minTickGap={18}
                            padding={{ left: 18, right: 18 }}
                          />
                          <YAxis
                            tickFormatter={(v: number) => v.toLocaleString('en-US')}
                            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={52}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ stroke: 'rgba(148, 163, 184, 0.35)' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="area_per_day_sqm"
                            stroke={PACE_COLOR}
                            strokeWidth={2}
                            dot={{ r: 4, fill: PACE_COLOR, stroke: '#111729', strokeWidth: 2 }}
                            activeDot={{ r: 6, stroke: '#111729', strokeWidth: 2 }}
                            animationDuration={700}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      Not enough dated records to work out a pace.
                    </p>
                  )}
                </ChartCard>

                <ChartCard
                  title="What each analysis compared"
                  subtitle="Each bar runs from the earlier image date to the later one. Bars that overlap cover some of the same days, so their changes should not be added together."
                  delay={500}
                  className="xl:col-span-2"
                >
                  <PeriodTimeline points={points} />
                </ChartCard>
              </div>

              {/* HOW TO READ */}

              <div className="ai-report-note mb-5" style={{ animationDelay: '560ms' }}>
                <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm leading-7">
                  These percentages show how much of the area looked different
                  between two satellite images. They are not the percentage of
                  construction completed.
                </p>
              </div>

              {/* WRITTEN ANALYSIS */}

              {!analysis && (
                <div className="ai-error-card">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h2 className="text-white font-semibold">
                        Written summary unavailable
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 leading-7">
                        {report.ai_error ||
                          'The AI summary could not be generated. Your charts are shown above.'}
                      </p>
                      <button
                        onClick={() => generateAnalysis(true)}
                        className="mt-4 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                      >
                        <RefreshCw size={15} />
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <ReportSection
                    title="In short"
                    icon={<FileText size={19} />}
                    delay={620}
                    className="ai-report-card--lead lg:col-span-2"
                  >
                    <p className="text-slate-100 text-base sm:text-lg leading-8 sm:leading-9">
                      {analysis.executive_summary}
                    </p>
                  </ReportSection>

                  <ReportSection
                    title="Progress Trend"
                    icon={<TrendingUp size={19} />}
                    delay={700}
                  >
                    <p className="text-slate-300 text-sm leading-8">
                      {analysis.progress_trend}
                    </p>
                  </ReportSection>

                  <ReportSection
                    title="Significant Observations"
                    icon={<Eye size={19} />}
                    delay={780}
                  >
                    <BulletList items={analysis.significant_observations} />
                  </ReportSection>

                  <ReportSection
                    title="Period Comparisons"
                    icon={<ClipboardList size={19} />}
                    delay={860}
                  >
                    <BulletList items={analysis.period_comparisons} />
                  </ReportSection>

                  <ReportSection
                    title="Limitations"
                    icon={<ShieldAlert size={19} />}
                    delay={940}
                  >
                    <BulletList items={analysis.limitations} />
                  </ReportSection>

                  <ReportSection
                    title="Conclusion"
                    icon={<CheckCircle2 size={19} />}
                    delay={1020}
                    className="lg:col-span-2"
                  >
                    <p className="text-slate-300 text-sm leading-8">
                      {analysis.conclusion}
                    </p>
                  </ReportSection>
                </div>
              )}

              {/* FOOTNOTE */}

              <p className="text-center text-slate-600 text-xs mt-10 leading-6">
                Charts are calculated directly from your monitoring records.
                The written sections are AI-generated; review the limitations
                before making project decisions.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}

export default AIAnalysis;
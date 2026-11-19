import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  PlayCircle,
  Loader2,
  Bot,
  Satellite,
  Layers,
  DatabaseZap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  History,
  Image as ImageIcon,
} from 'lucide-react';

import api from '../api/axios';
import { fetchSite, getCachedSite } from '../api/siteCache';
import DashboardNav from '../components/DashboardNav';

interface ConstructionSite {
  construction_id: string;
  site_name: string;
  start_date: string;
}

interface SatelliteInfo {
  release_date: string;
  release_id?: number;
  zoom?: number;
  center_mpp?: number;
  size_px?: [number, number];
  tiles_fetched?: number;
  successful_tiles?: number;
  missing_tiles?: number;
}

interface AnalysisResult {
  analysis_mode: string;
  threshold: number;
  requested_dates: {
    earlier_date: string;
    later_date: string;
  };
  actual_image_dates: {
    earlier_date: string;
    later_date: string;
  };
  area_changed_sqm: number | string;
  change_percentage: number | string;
  changed_pixels: number;
  total_pixels: number;
  site_area_sqm: number | string;
}

interface MonitoringResponse {
  status: string;
  message: string;
  // True when the same comparison was analysed within the last 10 days and
  // the saved result was returned (no new record added).
  from_cache?: boolean;
  cached_processed_at?: string;
  cache_valid_until?: string;
  // True when a fresh analysis overwrote the earlier record for these dates.
  record_updated?: boolean;
  progress: {
    progress_id: string;
    status: string;
    processed_at: string | null;
  };
  analysis: AnalysisResult;
  images: {
    baseline: string;
    latest: string;
    mask: string;
    overlay: string;
  };
  satellite_metadata: {
    earlier: SatelliteInfo;
    later: SatelliteInfo;
  };
}

type AnalysisMode = 'auto' | 'custom';

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatNumber(value: number | string | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MonitorSite() {
  const { id } = useParams<{ id: string }>();
  const todayStr = getLocalDate();

  // Paint straight away from the cached site (set by My Sites / Site Details),
  // then refresh it in the background.
  const cachedSite = id ? getCachedSite<ConstructionSite>(id) : undefined;

  const [site, setSite] = useState<ConstructionSite | null>(cachedSite ?? null);
  const [loadingInitial, setLoadingInitial] = useState(!cachedSite);

  const [mode, setMode] = useState<AnalysisMode>('auto');
  const [earlierDate, setEarlierDate] = useState(cachedSite?.start_date ?? '');
  const [laterDate, setLaterDate] = useState(cachedSite ? todayStr : '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MonitoringResponse | null>(null);

  // Load site details.
  useEffect(() => {
    let active = true;

    const loadSite = async () => {
      try {
        const found = await fetchSite<ConstructionSite>(id!);

        if (!active) return;

        if (found) {
          setSite(found);
        } else {
          setError('Site not found or you do not have access to it.');
        }
      } catch (err: any) {
        if (active) {
          if (err.response?.status === 404) {
            setError('Site not found or you do not have access to it.');
            setSite(null);
          } else if (!cachedSite) {
            // With a cached copy the form still works, so only a missing
            // site is worth an error here.
            setError('Unable to load site details. Please try again.');
          }
        }
      } finally {
        if (active) {
          setLoadingInitial(false);
        }
      }
    };

    if (id) {
      loadSite();
    } else {
      setError('Invalid construction site ID.');
      setLoadingInitial(false);
    }

    return () => {
      active = false;
    };
  }, [id, todayStr]);

  // Reset dates when switching back to Automatic mode.
  useEffect(() => {
    if (mode === 'auto' && site) {
      setEarlierDate(site.start_date);
      setLaterDate(todayStr);
    }
  }, [mode, site, todayStr]);

  const handleRunMonitor = async () => {
    if (!id || !site) return;

    if (!earlierDate || !laterDate) {
      setError('Please select both dates.');
      return;
    }

    if (earlierDate < site.start_date) {
      setError('The earlier date cannot be before the construction start date.');
      return;
    }

    if (earlierDate >= laterDate) {
      setError('The later date must be after the earlier date.');
      return;
    }

    setError('');
    setResult(null);
    setIsProcessing(true);

    try {
      const payload =
        mode === 'auto'
          ? {
              analysis_mode: 'baseline',
              later_date: laterDate,
            }
          : {
              analysis_mode: 'custom',
              earlier_date: earlierDate,
              later_date: laterDate,
            };

      const response = await api.post(
        `sites/${id}/progress/analyze/`,
        payload
      );

      setResult(response.data);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const backendCode = err.response?.data?.code;
      const backendMessage = err.response?.data?.detail;

      if (statusCode === 504 || backendCode === 'imagery_timeout') {
        setError(
          'Sorry, satellite imagery retrieval took too long. ' +
          'Please try an earlier start date or choose a different later date ' +
          'to find a suitable image comparison.'
        );
      } else if (
        statusCode === 422 ||
        backendCode === 'no_satellite_tiles'
      ) {
        setError(
          backendMessage ||
          'No usable satellite imagery was found for the selected dates. ' +
          'Please try a different date range.'
        );
      } else {
        setError(
          backendMessage ||
          'An error occurred while processing your monitoring request. ' +
          'Please try again.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // No cached copy (opened by direct link): show the page layout right away
  // with a placeholder card instead of a blank spinner screen.
  if (loadingInitial && !site) {
    return (
      <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">
        <div className="relative z-10 flex flex-col min-h-screen">
          <DashboardNav />
          <main className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-16 max-w-5xl mx-auto w-full">
            <div className="mb-10">
              <Link
                to={`/construction-site/member/${id}`}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={16} />
                Back to Site Details
              </Link>
              <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-tight">
                Monitor Progress
              </h1>
              <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-lg bg-white/[0.06]" />
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex items-center justify-center min-h-[320px]">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#080A19] flex flex-col items-center justify-center text-red-400 gap-4">
        <ShieldAlert size={32} />
        <p>{error || 'Site not found.'}</p>
        <Link
          to="/construction-site/member"
          className="text-emerald-400 hover:text-emerald-300"
        >
          Back to My Sites
        </Link>
      </div>
    );
  }

  const imageCards = result
    ? [
        {
          title: 'Baseline Image',
          description: `Earlier imagery: ${formatDate(
            result.analysis.actual_image_dates.earlier_date
          )}`,
          src: result.images.baseline,
        },
        {
          title: 'Latest Image',
          description: `Later imagery: ${formatDate(
            result.analysis.actual_image_dates.later_date
          )}`,
          src: result.images.latest,
        },
        {
          title: 'Change Detection Mask',
          description: 'Detected changed regions',
          src: result.images.mask,
        },
        {
          title: 'Change Overlay',
          description: 'Detected changes overlaid on the latest image',
          src: result.images.overlay,
        },
      ]
    : [];

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <main className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-16 max-w-5xl mx-auto w-full">

          {/* Header */}
          <div className="mb-10">
            <Link
              to={`/construction-site/member/${id}`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Site Details
            </Link>

            <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-tight">
              Monitor Progress
            </h1>

            <p className="text-slate-400 text-base mt-2">
              Run AI-based construction change detection on {site.site_name}.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Configuration */}
          {!result && !isProcessing && (
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">

              <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/5 mb-8 w-fit">
                <button
                  onClick={() => {
                    setMode('auto');
                    setError('');
                  }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'auto'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Automatic
                </button>

                <button
                  onClick={() => {
                    setMode('custom');
                    setError('');
                  }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'custom'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Dates
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

                {/* Earlier Date */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    Earlier Baseline Date
                  </label>

                  <input
                    type="date"
                    value={earlierDate}
                    min={site.start_date}
                    max={todayStr}
                    onChange={(e) => setEarlierDate(e.target.value)}
                    disabled={mode === 'auto'}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {mode === 'auto' && (
                    <p className="text-xs text-slate-500">
                      Uses the construction start date as the baseline.
                    </p>
                  )}
                </div>

                {/* Later Date */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-400" />
                    Later Comparison Date
                  </label>

                  <input
                    type="date"
                    value={laterDate}
                    min={mode === 'custom' ? earlierDate : site.start_date}
                    max={todayStr}
                    onChange={(e) => setLaterDate(e.target.value)}
                    disabled={mode === 'auto'}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {mode === 'auto' && (
                    <p className="text-xs text-slate-500">
                      Uses today's date as the requested comparison date.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={handleRunMonitor}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-8 py-3.5 rounded-xl text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  <PlayCircle size={20} />
                  Run AI Monitor
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping" />
                <div className="absolute inset-2 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                <Bot className="w-8 h-8 text-emerald-400 relative z-10 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Running AI Analysis
              </h2>

              <p className="text-sm text-slate-400 max-w-md">
                Retrieving satellite imagery, running the BIT change detection
                model, and saving your monitoring results. This may take a
                little while.
              </p>

              <div className="mt-8 flex flex-col gap-4 text-left w-full max-w-md">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Satellite size={19} />
                  <span className="text-sm">Retrieving satellite imagery</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <Layers size={19} />
                  <span className="text-sm">Running BIT change detection</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <DatabaseZap size={19} />
                  <span className="text-sm">Saving images and analysis results</span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {result && (
            <div className="space-y-8">

              {result.from_cache ? (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-5 flex items-start gap-3">
                  <History className="text-sky-400 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h2 className="text-sky-300 font-bold">
                      Showing your saved result for these dates
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      This comparison was already analysed
                      {result.cached_processed_at
                        ? ` on ${formatDateTime(result.cached_processed_at)}`
                        : ''}
                      , within the last 10 days, so the saved result was reused.
                      No new record was added to your progress history.
                    </p>
                    {result.cache_valid_until && (
                      <p className="text-xs text-slate-500 mt-2">
                        Running it again after{' '}
                        {formatDateTime(result.cache_valid_until)} will process
                        fresh imagery.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                  <div>
                    <h2 className="text-emerald-300 font-bold">
                      Analysis completed successfully
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {result.record_updated
                        ? 'The existing record for these dates was updated, so no duplicate was added.'
                        : 'Your construction monitoring results have been saved.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-slate-400">Changed Area</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {formatNumber(result.analysis.area_changed_sqm)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Square metres</p>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-slate-400">Change Percentage</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">
                    {formatNumber(result.analysis.change_percentage)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Detected change</p>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-slate-400">Site Area</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {formatNumber(result.analysis.site_area_sqm)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Square metres</p>
                </div>
              </div>

              {/* Dates and Model Details */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-5">
                  Analysis Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div>
                    <p className="text-slate-500">Analysis Mode</p>
                    <p className="text-white mt-1 capitalize">
                      {result.analysis.analysis_mode}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Detection Threshold</p>
                    <p className="text-white mt-1">
                      {result.analysis.threshold}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Requested Earlier Date</p>
                    <p className="text-white mt-1">
                      {formatDate(result.analysis.requested_dates.earlier_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Requested Later Date</p>
                    <p className="text-white mt-1">
                      {formatDate(result.analysis.requested_dates.later_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Actual Earlier Image Date</p>
                    <p className="text-white mt-1">
                      {formatDate(result.analysis.actual_image_dates.earlier_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Actual Later Image Date</p>
                    <p className="text-white mt-1">
                      {formatDate(result.analysis.actual_image_dates.later_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Changed Pixels</p>
                    <p className="text-white mt-1">
                      {formatNumber(result.analysis.changed_pixels)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Total Pixels</p>
                    <p className="text-white mt-1">
                      {formatNumber(result.analysis.total_pixels)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white">
                    Monitoring Images
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Satellite imagery and BIT model outputs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {imageCards.map((image) => (
                    <div
                      key={image.title}
                      className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden"
                    >
                      <div className="p-4">
                        <h4 className="font-semibold text-white">
                          {image.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {image.description}
                        </p>
                      </div>

                      <a
                        href={image.src}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-slate-950"
                      >
                        <img
                          src={image.src}
                          alt={image.title}
                          className="w-full aspect-square object-contain"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Satellite Metadata */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <ImageIcon size={19} className="text-emerald-400" />
                  Satellite Retrieval Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      title: 'Earlier Image',
                      info: result.satellite_metadata.earlier,
                    },
                    {
                      title: 'Later Image',
                      info: result.satellite_metadata.later,
                    },
                  ].map(({ title, info }) => (
                    <div key={title} className="space-y-3">
                      <h4 className="font-semibold text-emerald-400">
                        {title}
                      </h4>

                      <div className="text-sm space-y-2">
                        <p className="text-slate-400">
                          Release date:{' '}
                          <span className="text-white">
                            {formatDate(info.release_date)}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Zoom:{' '}
                          <span className="text-white">
                            {info.zoom ?? 'N/A'}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Missing tiles:{' '}
                          <span className="text-white">
                            {info.missing_tiles ?? 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setError('');
                  }}
                  className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Run Another Analysis
                </button>

                <Link
                  to={`/construction-site/member/${id}`}
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-center hover:bg-emerald-400 transition-colors"
                >
                  Back to Site Details
                </Link>
              </div>

            </div>
          )}
        </main>
      </div>
    </section>
  );
}
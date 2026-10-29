import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Satellite,
  Layers,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Info,
  Activity,
  History,
} from 'lucide-react';
import { getSite, getSiteProgress } from '../api/sites';
import type { ConstructionSite, ProgressLog } from '../types/site';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export const SiteMonitoringPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();

  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);

    try {
      const [siteData, logsData] = await Promise.all([
        getSite(siteId),
        getSiteProgress(siteId),
      ]);
      setSite(siteData);
      setProgressLogs(logsData);
      if (logsData.length > 0) {
        setSelectedLogIndex(0);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Failed to retrieve satellite progress telemetry for this site.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [siteId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <MorphBreadcrumbBar
          items={[
            { label: 'Mission Control', path: '/dashboard' },
            { label: 'Construction Sites', path: '/sites' },
            { label: 'Monitoring Telemetry' },
          ]}
        />
        <LoadingState message="Fetching multispectral satellite captures and AI change masks..." />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="space-y-6">
        <MorphBreadcrumbBar
          items={[
            { label: 'Mission Control', path: '/dashboard' },
            { label: 'Construction Sites', path: '/sites' },
            { label: 'Error' },
          ]}
        />
        <ErrorState
          title="Satellite Telemetry Unavailable"
          message={error || 'Site not found.'}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const currentLog = progressLogs.length > 0 ? progressLogs[selectedLogIndex] : null;

  const changedArea = currentLog?.area_changed_sqm
    ? Number(currentLog.area_changed_sqm).toLocaleString()
    : '0';
  const changePct = currentLog?.change_percentage
    ? Number(currentLog.change_percentage).toFixed(1)
    : '0.0';

  // Helper to render an image or a high-tech synthetic satellite radar placeholder
  const renderSatelliteImage = (
    label: string,
    tag: string,
    colorScheme: 'slate' | 'blue' | 'amber',
    filename?: string | null
  ) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const mediaHost = apiBase.replace(/\/api\/?$/, '');
    const imageUrl = filename ? `${mediaHost}/media/${filename}` : null;

    return (
      <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
        {/* Card Header */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                colorScheme === 'slate'
                  ? 'bg-slate-400'
                  : colorScheme === 'blue'
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {label}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {tag}
          </span>
        </div>

        {/* Image / Simulated Visual Display */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // If media file fails to load from server, display the simulated synthetic fallback
                (e.target as HTMLElement).style.display = 'none';
                const fallback = (e.target as HTMLElement).parentElement?.querySelector('.satellite-simulated-fallback');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}

          {/* Synthetic Geospatial Raster Fallback */}
          <div
            className={`satellite-simulated-fallback w-full h-full flex flex-col items-center justify-center p-6 text-center ${
              imageUrl ? 'hidden' : 'flex'
            }`}
          >
            {/* Background grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
                backgroundSize: '16px 16px',
              }}
            />

            {/* Concentric radar rings */}
            <div className="w-24 h-24 rounded-full border border-slate-800 flex items-center justify-center relative mb-3">
              <div className="w-16 h-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full ${
                    colorScheme === 'amber'
                      ? 'bg-amber-500/20 border border-amber-500/50'
                      : colorScheme === 'blue'
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-slate-700/30 border border-slate-600/50'
                  } flex items-center justify-center`}
                >
                  <Satellite
                    className={`w-4 h-4 ${
                      colorScheme === 'amber'
                        ? 'text-amber-400'
                        : colorScheme === 'blue'
                        ? 'text-blue-400'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-800 pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-800 pointer-events-none" />
            </div>

            <div className="relative z-10">
              <div className="text-xs font-mono font-medium text-slate-300 mb-1">
                {filename || `${label} Layer`}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {site.center_coordinates
                  ? `${site.center_coordinates.latitude}°, ${site.center_coordinates.longitude}°`
                  : 'Coordinates Bound'}
              </div>
            </div>
          </div>

          {/* Overlay Tag */}
          <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-300">
            Res: 10m GSD &bull; Sentinel-2
          </div>
        </div>

        {/* Card Footer Info */}
        <div className="px-4 py-2.5 bg-slate-950/50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Format: GeoTIFF/PNG</span>
          <span className="font-mono">{filename ? 'Cached' : 'Direct API Link'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* MorphBreadcrumbs */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'Construction Sites', path: '/sites' },
          { label: site.site_name, path: `/sites/${site.construction_id}` },
          { label: 'Telemetry & AI Monitoring' },
        ]}
      />

      {/* Header section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI CHANGE DETECTION ENGINE</span>
              </span>
              <StatusBadge status={site.is_completed ? 'completed' : 'active'} size={14} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {site.site_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {[site.location, site.city, site.country].filter(Boolean).join(', ') ||
                    'Coordinates assigned'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Surveillance Extent: {site.extent_meters ?? 500}m radius</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>

            <Link
              to={`/sites/${site.construction_id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all"
            >
              <span>Site Overview</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Imagery and Analysis Section */}
      {progressLogs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
            <Satellite className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Satellite Pass Queued for This Site
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Coordinates ({site.center_coordinates?.latitude}°, {site.center_coordinates?.longitude}°) have been registered in the orbital schedule. The initial baseline capture and segmentation log will populate after the next satellite cycle.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/sites"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-all shadow-md shadow-blue-600/30"
            >
              Back to Sites Directory
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Strip for Current Log */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Satellite Image Date</span>
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {currentLog?.satellite_image_date || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Changed Earthwork Area</span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {changedArea} m²
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Change Percentage</span>
              </div>
              <div className="text-lg font-mono font-bold text-amber-300">
                {changePct}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pipeline Status</span>
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">
                <StatusBadge status={currentLog?.status || 'done'} size={14} />
              </div>
            </div>
          </div>

          {/* 3-Panel Multispectral Satellite Comparison Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Computer Vision Comparison Matrix</span>
              </h2>
              <span className="text-xs text-slate-400">
                Capture cycle #{selectedLogIndex + 1} of {progressLogs.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Panel 1: Baseline Image */}
              {renderSatelliteImage(
                'Baseline Reference Scan',
                'T0 Reference',
                'slate',
                currentLog?.baseline_image_filename
              )}

              {/* Panel 2: Latest Satellite Image */}
              {renderSatelliteImage(
                'Latest Satellite Pass',
                'T1 Observation',
                'blue',
                currentLog?.latest_image_filename
              )}

              {/* Panel 3: Change Mask Overlay */}
              {renderSatelliteImage(
                'AI Change Mask',
                'ResNet Inference',
                'amber',
                currentLog?.change_mask_filename
              )}
            </div>
          </div>

          {/* Historical Capture Timeline */}
          {progressLogs.length > 1 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Historical Satellite Observation Timeline</span>
              </h3>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {progressLogs.map((log, idx) => (
                  <button
                    key={log.progress_id || idx}
                    type="button"
                    onClick={() => setSelectedLogIndex(idx)}
                    className={`flex flex-col p-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                      selectedLogIndex === idx
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-mono font-semibold">
                      Pass #{progressLogs.length - idx}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {log.satellite_image_date || 'Recent Pass'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1">
                      {log.change_percentage ? `${Number(log.change_percentage).toFixed(1)}% altered` : 'Calculated'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deep Learning Metadata card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Processed at: <strong className="text-slate-200 font-mono">{currentLog?.processed_at ? new Date(currentLog.processed_at).toLocaleString() : 'Recent inference run'}</strong> &bull; Model architecture: PyTorch Siamese CNN with ResNet-50 backbone.
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[11px] shrink-0">
              Log ID: {currentLog?.progress_id?.slice(0, 12)}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteMonitoringPage;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Satellite,
  MapPin,
  Calendar,
  Globe,
  ArrowRight,
  Copy,
  Check,
  Shield,
  Clock,
  Building2,
} from 'lucide-react';
import { getSite } from '../api/sites';
import type { ConstructionSite } from '../types/site';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export const SiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();

  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSiteDetails = async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getSite(siteId);
      setSite(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Could not retrieve site specifications. The site might not exist or you lack authorization.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSiteDetails();
  }, [siteId]);

  const handleCopyId = () => {
    if (!siteId) return;
    navigator.clipboard.writeText(siteId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <MorphBreadcrumbBar
          items={[
            { label: 'Mission Control', path: '/dashboard' },
            { label: 'Construction Sites', path: '/sites' },
            { label: 'Loading Site...' },
          ]}
        />
        <LoadingState message="Retrieving construction site telemetry specifications..." />
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
          title="Site Specifications Unavailable"
          message={error || 'Site not found.'}
          onRetry={fetchSiteDetails}
        />
      </div>
    );
  }

  const progress =
    site.current_progress !== null && site.current_progress !== undefined
      ? Number(site.current_progress)
      : 0;

  return (
    <div className="space-y-6">
      {/* MorphBreadcrumbs */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'Construction Sites', path: '/sites' },
          { label: site.site_name },
        ]}
      />

      {/* Header section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <StatusBadge status={site.is_completed ? 'completed' : 'active'} size={15} />
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {site.is_public ? 'Public Engineering Site' : 'Private Project'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {site.site_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {[site.location, site.city, site.country].filter(Boolean).join(', ') ||
                    'Location pending'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Commenced: {site.start_date || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-mono transition-all cursor-pointer"
              title="Copy UUID for access collaboration"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">UUID Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Site ID</span>
                </>
              )}
            </button>

            <Link
              to={`/sites/${site.construction_id}/monitoring`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer group"
            >
              <Satellite className="w-4 h-4" />
              <span>Launch Monitoring Telemetry</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of site specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Earthwork & Geography */}
        <div className="lg:col-span-7 space-y-6">
          {/* Progress Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Cumulative Earthwork Completion</span>
              </h2>
              <span className="text-lg font-mono font-bold text-blue-400">{progress}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Progress calculation is evaluated by comparing multi-spectral surface alterations against the registered baseline satellite scan using computer vision segmentation algorithms.
            </p>
          </div>

          {/* Geo Coordinates & Bounds */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Geospatial Coordinates &amp; Bounding AOI</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Latitude
                </div>
                <div className="text-lg font-mono font-semibold text-white">
                  {site.center_coordinates ? `${site.center_coordinates.latitude}°` : 'Unassigned'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Longitude
                </div>
                <div className="text-lg font-mono font-semibold text-white">
                  {site.center_coordinates ? `${site.center_coordinates.longitude}°` : 'Unassigned'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Surveillance Radius
                </div>
                <div className="text-lg font-mono font-semibold text-blue-400">
                  {site.extent_meters ?? 500} meters
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Surface Area Approx.
                </div>
                <div className="text-lg font-mono font-semibold text-slate-200">
                  {site.area ? `${Number(site.area).toLocaleString()} m²` : 'Calculated automatically'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Project Meta & Access Sharing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Project Metadata</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Site ID</span>
                <span className="font-mono text-slate-300 max-w-[180px] truncate" title={site.construction_id}>
                  {site.construction_id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Created By</span>
                <span className="font-mono text-slate-300">{site.created_by || 'Civil Engineer'}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Registration Date</span>
                <span className="font-mono text-slate-300">
                  {site.created_at ? new Date(site.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Project Status</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {site.is_completed ? 'Completed' : 'Under Active Surveillance'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Target Completion</span>
                <span className="font-mono text-slate-300">{site.end_date || 'Open Horizon'}</span>
              </div>
            </div>
          </div>

          {/* Quick Access Sharing Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/20 to-slate-900 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Collaborative Access</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To allow team members or subcontractors to monitor this site, have them input this Site UUID in the <strong>Request Access</strong> modal. You will receive an authorization prompt under <strong>Incoming Access</strong>.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-blue-300">
              <span className="truncate mr-2">{site.construction_id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDetailPage;

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  PlusCircle,
  KeyRound,
  ArrowRight,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { useSites } from '../hooks/useSites';
import { useIncomingRequests } from '../hooks/useIncomingRequests';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export const DashboardPage: React.FC = () => {
  const { sites, loading: sitesLoading, error: sitesError, refresh: refreshSites } = useSites();
  const { requests: incoming, loading: incomingLoading, refresh: refreshIncoming } = useIncomingRequests();

  const handleRefreshAll = () => {
    void refreshSites();
    void refreshIncoming();
  };

  const username = localStorage.getItem('user_username') || 'Engineer';

  const totalSites = sites.length;
  const completedSites = sites.filter((s) => s.is_completed === true).length;
  const activeSites = totalSites - completedSites;
  const pendingRequests = incoming.filter((r) => r.status === 'pending').length;

  const recentSites = sites.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Morphing Breadcrumb */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'Overview Telemetry' },
        ]}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEO-ORBITAL SURVEILLANCE ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-blue-400 font-mono">{username}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multispectral satellite earthwork tracking and computer vision site telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={sitesLoading || incomingLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(sitesLoading || incomingLoading) ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/sites"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Site</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sites */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Monitored Sites
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Satellite className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-white tracking-tight">
            {sitesLoading ? '...' : totalSites}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-blue-400 font-medium">All registered</span>
            <span>in Supabase DB</span>
          </div>
        </div>

        {/* Active Sites */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Construction
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-300 tracking-tight">
            {sitesLoading ? '...' : activeSites}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-amber-400 font-medium">Ongoing pass cycles</span>
          </div>
        </div>

        {/* Completed Sites */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Completed Sites
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {sitesLoading ? '...' : completedSites}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">Verified deliverables</span>
          </div>
        </div>

        {/* Incoming Access Requests */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Access
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-300 tracking-tight">
            {incomingLoading ? '...' : pendingRequests}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            {pendingRequests > 0 ? (
              <Link to="/access-requests" className="text-amber-400 font-medium hover:underline flex items-center gap-1">
                <span>Requires review &rarr;</span>
              </Link>
            ) : (
              <span>No pending approvals</span>
            )}
          </div>
        </div>
      </div>

      {/* Pending Access Alert Banner if any */}
      {pendingRequests > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {pendingRequests} Engineer{pendingRequests > 1 ? 's' : ''} requested access to your sites
              </h3>
              <p className="text-xs text-slate-400">
                Grant or decline access permissions to maintain project boundary privacy.
              </p>
            </div>
          </div>
          <Link
            to="/access-requests"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* Main Content Split: Sites Overview + Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Recent Sites */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">
                Recent Monitored Sites
              </h2>
            </div>
            <Link
              to="/sites"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View all ({totalSites})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sitesLoading && <LoadingState message="Connecting to Django REST API & Supabase DB..." />}

          {sitesError && (
            <ErrorState
              title="Failed to Load Sites"
              message={sitesError}
              onRetry={refreshSites}
            />
          )}

          {!sitesLoading && !sitesError && sites.length === 0 && (
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
              <Satellite className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-white mb-1">
                No Construction Sites Registered Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Register your first site coordinates or request access to an existing engineering site.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/sites"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-all shadow-md shadow-blue-600/25"
                >
                  Register First Site
                </Link>
                <Link
                  to="/my-join-requests"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all border border-slate-700"
                >
                  Join Site by ID
                </Link>
              </div>
            </div>
          )}

          {!sitesLoading && !sitesError && sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentSites.map((site) => {
                const progressNum =
                  site.current_progress !== null && site.current_progress !== undefined
                    ? Number(site.current_progress)
                    : 0;

                return (
                  <div
                    key={site.construction_id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {site.site_name}
                        </h3>
                        <StatusBadge
                          status={site.is_completed ? 'completed' : 'active'}
                          size={14}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {[site.location, site.city, site.country].filter(Boolean).join(', ') ||
                            'Coordinates assigned'}
                        </span>
                      </div>

                      {/* Extent & Coordinate tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                          {site.extent_meters ?? 500}m radius
                        </span>
                        {site.center_coordinates && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-400">
                            {Number(site.center_coordinates.latitude).toFixed(3)}°, {Number(site.center_coordinates.longitude).toFixed(3)}°
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Earthwork Progress</span>
                          <span className="font-mono font-medium text-slate-200">
                            {progressNum}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, progressNum))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <Link
                        to={`/sites/${site.construction_id}`}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Site Details
                      </Link>
                      <Link
                        to={`/sites/${site.construction_id}/monitoring`}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium group-hover:translate-x-0.5 transition-all"
                      >
                        <span>Telemetry &amp; Imagery</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 Cols: System Status & Operations */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Operations card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Quick Operations</span>
            </h3>

            <div className="space-y-2">
              <Link
                to="/sites"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Register Site</div>
                    <div className="text-[11px] text-slate-400">Input GPS &amp; extent bounds</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/my-join-requests"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Request Site Access</div>
                    <div className="text-[11px] text-slate-400">Join site using UUID key</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/access-requests"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Review Join Requests</div>
                    <div className="text-[11px] text-slate-400">Manage site team permissions</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* Satellite Telematics Spec Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sensor Stream</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                CONNECTED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Constellation</span>
                <span className="text-white font-mono">Sentinel-2 &bull; Planet</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Spectral Bands</span>
                <span className="text-white font-mono">RGB + NIR (B2, B3, B4, B8)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Inference Core</span>
                <span className="text-white font-mono">PyTorch / ResNet-50</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Cloud Filter</span>
                <span className="text-white font-mono">&le; 15% Cover</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct PostgreSQL sync via Django REST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  PlusCircle,
  KeyRound,
  Search,
  Filter,
  MapPin,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { useSites } from '../hooks/useSites';
import { createSite } from '../api/sites';
import { requestSiteAccess } from '../api/accessRequests';
import type { CreateSitePayload } from '../types/site';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export const SitesPage: React.FC = () => {
  const { sites, loading, error, refresh } = useSites();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Create Site Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [area, setArea] = useState<string>('25000');
  const [latitude, setLatitude] = useState<string>('24.8607');
  const [longitude, setLongitude] = useState<string>('67.0011');
  const [extentMeters, setExtentMeters] = useState<string>('500');
  const [isPublic, setIsPublic] = useState(true);

  // Request Access Modal state
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessSiteId, setAccessSiteId] = useState('');
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessSuccess, setAccessSuccess] = useState<string | null>(null);

  // Copy UUID tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const extentNum = parseInt(extentMeters, 10);
    const areaNum = area ? parseFloat(area) : undefined;

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setCreateError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setCreateError('Longitude must be a valid number between -180 and 180.');
      return;
    }
    if (isNaN(extentNum) || extentNum < 1 || extentNum > 1000) {
      setCreateError('Extent meters must be between 1 and 1000 (enforced by satellite processing bounds).');
      return;
    }

    const payload: CreateSitePayload = {
      site_name: siteName.trim(),
      start_date: startDate,
      location: locationName.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      area: areaNum,
      is_public: isPublic,
      center_coordinates: {
        latitude: latNum,
        longitude: lonNum,
      },
      extent_meters: extentNum,
    };

    setCreateSubmitting(true);
    try {
      await createSite(payload);
      setIsCreateModalOpen(false);
      // Reset form
      setSiteName('');
      setLocationName('');
      setCity('');
      setCountry('');
      await refresh();
    } catch (err: any) {
      const detail =
        err?.response?.data?.extent_meters?.[0] ||
        err?.response?.data?.center_coordinates?.[0] ||
        err?.response?.data?.detail ||
        'Failed to register construction site. Please check input formats.';
      setCreateError(detail);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessSiteId.trim()) return;

    setAccessSubmitting(true);
    setAccessError(null);
    setAccessSuccess(null);

    try {
      await requestSiteAccess(accessSiteId.trim());
      setAccessSuccess('Access request submitted to site owner! Track status in My Join Requests.');
      setTimeout(() => {
        setIsAccessModalOpen(false);
        setAccessSuccess(null);
        setAccessSiteId('');
      }, 2500);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.site_id?.[0] ||
        'Could not submit access request. Verify that the site UUID is valid.';
      setAccessError(detail);
    } finally {
      setAccessSubmitting(false);
    }
  };

  // Filtered sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.location && site.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (site.city && site.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (site.country && site.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      site.construction_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return site.is_completed !== true;
    if (statusFilter === 'completed') return site.is_completed === true;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* MorphBreadcrumb Navigation */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'Construction Sites' },
        ]}
      />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Satellite className="w-7 h-7 text-blue-400" />
            <span>Monitored Sites Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered civil engineering sites, satellite pass boundaries, and automated change tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh sites"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setAccessError(null);
              setAccessSuccess(null);
              setIsAccessModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Request Access by ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Site</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by site name, city, country, or UUID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({sites.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && <LoadingState message="Querying registered construction sites from Supabase via Django..." />}

      {error && <ErrorState title="Error Fetching Sites" message={error} onRetry={refresh} />}

      {!loading && !error && filteredSites.length === 0 && (
        <EmptyState
          title={searchTerm ? 'No matching sites found' : 'No construction sites registered yet'}
          description={
            searchTerm
              ? `No site matched your query "${searchTerm}". Try adjusting filters or search term.`
              : 'Add your first construction site by providing geographic coordinates and extent bounds.'
          }
          actionLabel="Register New Site"
          onAction={() => setIsCreateModalOpen(true)}
        />
      )}

      {!loading && !error && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => {
            const progress =
              site.current_progress !== null && site.current_progress !== undefined
                ? Number(site.current_progress)
                : 0;

            return (
              <div
                key={site.construction_id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all flex flex-col justify-between p-5 relative group shadow-sm hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div>
                  {/* Top Bar: Name & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                      {site.site_name}
                    </h2>
                    <StatusBadge
                      status={site.is_completed ? 'completed' : 'active'}
                      size={14}
                    />
                  </div>

                  {/* Location info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {[site.location, site.city, site.country].filter(Boolean).join(', ') ||
                        'Location details pending'}
                    </span>
                  </div>

                  {/* UUID Bar with Copy button */}
                  <div className="mb-4 flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                    <span className="truncate max-w-[200px]" title={site.construction_id}>
                      {site.construction_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(site.construction_id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Site ID for access sharing"
                    >
                      {copiedId === site.construction_id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Satellite Parameters Table */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Scan Extent
                      </div>
                      <div className="font-mono text-slate-200 mt-0.5">
                        {site.extent_meters ?? 500}m radius
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Start Date
                      </div>
                      <div className="font-mono text-slate-200 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{site.start_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Earthwork Progress */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Earthwork Progress</span>
                      <span className="font-mono font-medium text-slate-200">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <Link
                    to={`/sites/${site.construction_id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Site Details
                  </Link>

                  <Link
                    to={`/sites/${site.construction_id}/monitoring`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-medium border border-blue-500/30 transition-all"
                  >
                    <span>Telemetry &amp; Imagery</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SITE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Register Construction Site</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{createError}</div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Site Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Metro Line 4 Overhead Terminal"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Scan Extent (Meters: 1 - 1000) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={extentMeters}
                    onChange={(e) => setExtentMeters(e.target.value)}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Center Coordinates (GPS)</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Latitude (-90 to +90) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="24.8607"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Longitude (-180 to +180) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="67.0011"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Location / Zone
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Sector 12"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Karachi"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Pakistan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Area (m²)
                  </label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-xs text-slate-300 cursor-pointer">
                  Public Site (Discoverable by other engineers for access requests)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {createSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Register Site</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST ACCESS MODAL */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Request Site Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter the UUID of the construction site you want to access. The project owner will receive your request for approval.
            </p>

            {accessError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{accessError}</div>
              </div>
            )}

            {accessSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{accessSuccess}</div>
              </div>
            )}

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Site UUID Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accessSiteId}
                  onChange={(e) => setAccessSiteId(e.target.value)}
                  placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accessSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {accessSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesPage;

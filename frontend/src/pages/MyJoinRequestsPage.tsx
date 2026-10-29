import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Satellite,
} from 'lucide-react';
import { useJoinRequests } from '../hooks/useJoinRequests';
import { requestSiteAccess } from '../api/accessRequests';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export const MyJoinRequestsPage: React.FC = () => {
  const { requests, loading, error, refresh } = useJoinRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siteIdInput, setSiteIdInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteIdInput.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await requestSiteAccess(siteIdInput.trim());
      setSubmitSuccess('Access request sent successfully! Site owner has been notified.');
      setSiteIdInput('');
      await refresh();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(null);
      }, 2000);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.site_id?.[0] ||
        'Could not submit access request. Ensure the Site ID is a valid UUID.';
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.site_name && r.site_name.toLowerCase().includes(term)) ||
      (r.site_id && r.site_id.toLowerCase().includes(term)) ||
      (r.request_to && r.request_to.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* MorphBreadcrumbs */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'My Join Requests' },
        ]}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-blue-400" />
            <span>My Site Join Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track authorization requests sent to construction site owners for telemetry access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setSubmitSuccess(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Join Site by ID</span>
          </button>
        </div>
      </div>

      {/* Search / Filter bar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter requests by site name, ID, or status..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 px-2 font-mono">
          {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Loading your submitted access requests from Django..." />}

      {error && <ErrorState title="Failed to Load Requests" message={error} onRetry={refresh} />}

      {!loading && !error && filteredRequests.length === 0 && (
        <EmptyState
          title={searchTerm ? 'No matching requests' : 'No access requests submitted yet'}
          description={
            searchTerm
              ? `No join request matches "${searchTerm}".`
              : 'You have not requested access to any external sites yet. Use the Site UUID key from a collaborator to request permission.'
          }
          actionLabel="Request Site Access"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {!loading && !error && filteredRequests.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Target Site
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Site UUID
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Owner
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Request Date
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.request_id}
                    className="hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      {req.site_name || 'Construction Site'}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      <span className="truncate max-w-[140px] block" title={req.site_id || ''}>
                        {req.site_id || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {req.request_to || 'Site Lead'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status || 'pending'} size={14} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {req.status === 'accepted' && req.site_id ? (
                        <Link
                          to={`/sites/${req.site_id}/monitoring`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-all"
                        >
                          <Satellite className="w-3.5 h-3.5" />
                          <span>View Monitoring</span>
                        </Link>
                      ) : req.status === 'rejected' ? (
                        <span className="text-[11px] text-rose-400/80 font-mono">
                          Access Declined
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400/80 font-mono flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Awaiting Review</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT JOIN REQUEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Join Construction Site</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Submit an access application using the unique UUID of the construction site.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{submitError}</div>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{submitSuccess}</div>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Site UUID Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={siteIdInput}
                  onChange={(e) => setSiteIdInput(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <span>Submit Join Request</span>
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

export default MyJoinRequestsPage;

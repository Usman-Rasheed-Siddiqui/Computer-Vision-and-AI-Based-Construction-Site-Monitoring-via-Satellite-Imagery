import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import { useIncomingRequests } from '../hooks/useIncomingRequests';
import { decideAccessRequest } from '../api/accessRequests';
import MorphBreadcrumbBar from '../components/common/MorphBreadcrumbBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

export const IncomingRequestsPage: React.FC = () => {
  const { requests, loading, error, refresh } = useIncomingRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'decided'>('all');

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    requestId: string;
    action: 'accept' | 'reject';
    requester: string;
    siteName: string;
  }>({
    open: false,
    requestId: '',
    action: 'accept',
    requester: '',
    siteName: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleOpenConfirm = (
    requestId: string,
    action: 'accept' | 'reject',
    requester: string,
    siteName: string
  ) => {
    setActionFeedback(null);
    setConfirmModal({
      open: true,
      requestId,
      action,
      requester: requester || 'Engineer',
      siteName: siteName || 'this site',
    });
  };

  const handleExecuteDecision = async () => {
    setActionLoading(true);
    setActionFeedback(null);

    try {
      await decideAccessRequest(confirmModal.requestId, confirmModal.action);
      setActionFeedback({
        type: 'success',
        message: `Successfully ${confirmModal.action === 'accept' ? 'granted' : 'declined'} site access for ${confirmModal.requester}.`,
      });
      setConfirmModal((prev) => ({ ...prev, open: false }));
      await refresh();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        `Failed to ${confirmModal.action} request. Please try again.`;
      setActionFeedback({
        type: 'error',
        message: detail,
      });
      setConfirmModal((prev) => ({ ...prev, open: false }));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (r.site_name && r.site_name.toLowerCase().includes(term)) ||
      (r.requester_email && r.requester_email.toLowerCase().includes(term)) ||
      (r.request_from && r.request_from.toLowerCase().includes(term)) ||
      (r.site_id && r.site_id.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return r.status === 'pending';
    if (filterStatus === 'decided') return r.status === 'accepted' || r.status === 'rejected';
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* MorphBreadcrumbs */}
      <MorphBreadcrumbBar
        items={[
          { label: 'Mission Control', path: '/dashboard' },
          { label: 'Incoming Access Requests' },
        ]}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="w-7 h-7 text-indigo-400" />
            <span>Incoming Site Access Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authorize or decline team engineer requests seeking to view your site's telemetry and change masks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by site name, requester email or username..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('decided')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === 'decided'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Decided
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Fetching incoming access requests from Django REST..." />}

      {error && <ErrorState title="Failed to Load Requests" message={error} onRetry={refresh} />}

      {!loading && !error && filteredRequests.length === 0 && (
        <EmptyState
          title={searchTerm ? 'No matching requests' : 'No incoming access requests'}
          description={
            searchTerm
              ? `No requests match "${searchTerm}".`
              : 'You do not have any pending or previous access requests for your registered sites.'
          }
        />
      )}

      {!loading && !error && filteredRequests.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Construction Site
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Requester
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Request Date
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRequests.map((req) => {
                  const requesterDisplay = req.requester_email || req.request_from || 'Civil Engineer';
                  const isPending = req.status === 'pending';

                  return (
                    <tr
                      key={req.request_id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {req.site_name || 'Construction Site'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={req.site_id || ''}>
                          ID: {req.site_id || 'N/A'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{requesterDisplay}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={req.status || 'pending'} size={14} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenConfirm(
                                  req.request_id,
                                  'accept',
                                  requesterDisplay,
                                  req.site_name || 'site'
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenConfirm(
                                  req.request_id,
                                  'reject',
                                  requesterDisplay,
                                  req.site_name || 'site'
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Decision Finalized
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM DECISION MODAL */}
      <ConfirmDialog
        isOpen={confirmModal.open}
        title={confirmModal.action === 'accept' ? 'Authorize Site Access' : 'Decline Access Request'}
        message={`Are you sure you want to ${
          confirmModal.action === 'accept' ? 'grant' : 'reject'
        } satellite monitoring permissions for ${confirmModal.requester} on "${
          confirmModal.siteName
        }"?`}
        confirmLabel={confirmModal.action === 'accept' ? 'Grant Access' : 'Decline Request'}
        cancelLabel="Cancel"
        variant={confirmModal.action === 'accept' ? 'success' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleExecuteDecision}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default IncomingRequestsPage;

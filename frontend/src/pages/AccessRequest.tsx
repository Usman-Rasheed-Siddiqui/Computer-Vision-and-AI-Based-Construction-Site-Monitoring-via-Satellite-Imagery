import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Check,
  X,
  Clock,
  Mail,
  RefreshCw,
  Inbox,
  Send,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

import api from '../api/axios';
import DashboardNav from '../components/DashboardNav';
import SwipeToast from '../components/SwipeToast';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

interface AccessRequest {
  request_id: string;
  site_id: string;
  site_name: string;
  requester_email: string;
  requester_name?: string | null;
  request_from: string;
  request_to: string;
  construction: string;
  status: string;
  created_at: string | null;
}

interface SiteLookup {
  site_id: string;
  site_name: string;
  location: string | null;
  city: string | null;
  country: string | null;
  // Your relationship to the site, if any: you can only request when this is null.
  relationship: 'owner' | 'member' | 'pending' | null;
}

const RELATIONSHIP_MESSAGE: Record<string, string> = {
  owner: 'You own this site, so you already have access.',
  member: 'You already have access to this site.',
  pending: 'You already have a pending request for this site.',
};

type ToastKind = 'success' | 'error' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

const TOAST_STYLE: Record<ToastKind, { fuse: string; icon: ReactNode }> = {
  success: {
    fuse: '#34d399',
    icon: <CheckCircle2 className="text-emerald-400" />,
  },
  error: {
    fuse: '#f87171',
    icon: <AlertCircle className="text-red-400" />,
  },
  warning: {
    fuse: '#f5a524',
    icon: <ShieldAlert className="text-amber-400" />,
  },
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CARD =
  'rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20';

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Accept either a plain list or a paginated { results: [] } response.
const toList = (data: any): AccessRequest[] =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

const displayName = (request: AccessRequest) =>
  request.requester_name?.trim() || request.requester_email;

const getInitials = (request: AccessRequest) => {
  const name = request.requester_name?.trim();

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  return (request.requester_email[0] || '?').toUpperCase();
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatusBadge({ status }: { status: string }) {
  const key = (status || '').toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        STATUS_STYLE[key] || 'bg-slate-800/80 text-slate-300 border-slate-700'
      }`}
    >
      {key === 'pending' && <Clock size={13} />}
      {key === 'approved' && <Check size={13} />}
      {key === 'rejected' && <X size={13} />}
      {key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown'}
    </span>
  );
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#4ADE80]">{icon}</span>

      <h2 className="text-white text-lg font-medium">{title}</h2>

      {count !== undefined && (
        <span className="ml-1 rounded-full border border-[#15803D]/30 bg-[#15803D]/10 px-3 py-0.5 text-xs text-[#4ADE80]">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 px-5 py-10 text-center">
      <p className="text-white/40 text-sm">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------
// PAGE
// ---------------------------------------------------------

function AccessRequests() {
  const [incoming, setIncoming] = useState<AccessRequest[]>([]);
  const [sent, setSent] = useState<AccessRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [siteId, setSiteId] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lookup, setLookup] = useState<SiteLookup | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounter = useRef(0);

  const notify = (kind: ToastKind, title: string, description?: string) => {
    toastCounter.current += 1;
    const id = toastCounter.current;

    setToasts((current) => [...current, { id, kind, title, description }]);
  };

  const removeToast = (id: number) =>
    setToasts((current) => current.filter((toast) => toast.id !== id));

  // ---------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------

  const loadRequests = useCallback(async () => {
    try {
      const [incomingResponse, sentResponse] = await Promise.all([
        api.get('incoming-access-requests/'),
        api.get('my-join-requests/'),
      ]);

      setIncoming(toList(incomingResponse.data));
      setSent(toList(sentResponse.data));
      setLoadError('');
    } catch (err: any) {
      setLoadError(
        err.response?.data?.detail ||
          'Unable to load access requests. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // ---------------------------------------------------------
  // SEND A REQUEST
  // ---------------------------------------------------------

  // Step 1: check the ID and show which site it belongs to.
  const handleCheckSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const id = siteId.trim();

    if (!id) {
      setFieldError('Please enter a Site ID.');
      return;
    }

    if (!UUID_PATTERN.test(id)) {
      setFieldError(
        'That is not a valid Site ID. It looks like 027381ae-7134-4f3f-8779-7c84ec2ff9bb.'
      );
      return;
    }

    setFieldError('');
    setLookup(null);
    setNotFound(false);
    setChecking(true);

    try {
      const response = await api.get<SiteLookup>(`sites/lookup/${id}/`);

      setLookup(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setFieldError(
          err.response?.data?.detail ||
            'Unable to check that Site ID. Please try again.'
        );
      }
    } finally {
      setChecking(false);
    }
  };

  // Step 2: send the request for the site that was just confirmed.
  const handleRequestAccess = async () => {
    if (!lookup || lookup.relationship) return;

    setFieldError('');
    setSending(true);

    try {
      await api.post('my-join-requests/', {
        site_id: lookup.site_id,
      });

      notify(
        'success',
        'Access request sent',
        `Waiting for the owner of ${lookup.site_name} to respond.`
      );

      setSiteId('');
      setLookup(null);
      await loadRequests();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        'Unable to send your request. Please try again.';

      setFieldError(detail);
      notify('error', 'Request not sent', detail);
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------
  // ACCEPT / REJECT (site owner only; the server enforces this too)
  // ---------------------------------------------------------

  const handleDecision = async (
    request: AccessRequest,
    action: 'accept' | 'reject'
  ) => {
    setBusyId(request.request_id);

    try {
      await api.post(`access-requests/${request.request_id}/decide/`, {
        action,
      });

      setIncoming((current) =>
        current.filter((item) => item.request_id !== request.request_id)
      );
      setConfirmRejectId(null);

      if (action === 'accept') {
        notify(
          'success',
          'Access granted',
          `${displayName(request)} can now view ${request.site_name}.`
        );
      } else {
        notify(
          'success',
          'Request rejected',
          `${displayName(request)} was not given access to ${request.site_name}.`
        );
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        notify(
          'warning',
          'Already handled',
          'This request is no longer waiting for a decision.'
        );
        loadRequests();
      } else {
        notify(
          'error',
          'Could not update the request',
          err.response?.data?.detail || 'Please try again.'
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  // ---------------------------------------------------------
  // DERIVED NUMBERS
  // ---------------------------------------------------------

  const acceptedCount = sent.filter(
    (item) => item.status?.toLowerCase() === 'approved'
  ).length;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <section className="relative min-h-screen w-full bg-[#080A19] text-slate-100 font-sans">
      <div className="relative z-10 flex min-h-screen flex-col">
        <DashboardNav />

        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14 md:px-[82px]">

          {/* PAGE HEADER */}

          <div className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Link
                to="/construction-site/member"
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to My Sites
              </Link>

              <div className="mb-3">
                <span className="text-[#4ADE80] text-xs font-semibold uppercase tracking-[0.2em]">
                  Construction Monitoring
                </span>
              </div>

              <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-[1.1]">
                Access Requests
              </h1>

              <p className="mt-3 max-w-xl text-sm text-white/40">
                Ask to join another site, and approve or reject people who ask
                to join yours.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* REQUEST ACCESS TO A SITE */}

          <div className={`${CARD} mb-6 p-5 sm:p-7`}>
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <Share2 size={19} className="text-[#4ADE80]" />

                <h2 className="text-white text-lg font-medium">
                  Request Access to a Site
                </h2>
              </div>

              <p className="text-sm text-white/40">
                Enter a Site ID and press Check Site to confirm which site it
                is. Then send your request to its owner. The ID is shown at the
                top of that site's details page.
              </p>
            </div>

            <form
              onSubmit={handleCheckSite}
              className="flex flex-col gap-3 sm:flex-row"
              noValidate
            >
              <input
                type="text"
                value={siteId}
                onChange={(event) => {
                  setSiteId(event.target.value);
                  // A new ID must be checked again before it can be requested.
                  setLookup(null);
                  setNotFound(false);
                  if (fieldError) setFieldError('');
                }}
                placeholder="Enter construction Site ID"
                aria-label="Construction Site ID"
                aria-invalid={!!fieldError || notFound}
                className={`min-w-0 flex-1 rounded-xl border bg-slate-950/50 p-3 font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-white/30 focus:border-emerald-500 ${
                  fieldError || notFound ? 'border-red-500/50' : 'border-slate-700'
                }`}
              />

              <button
                type="submit"
                disabled={checking || sending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search size={16} />
                {checking ? 'Checking...' : 'Check Site'}
              </button>
            </form>

            {fieldError && (
              <p className="mt-3 text-sm leading-6 text-red-400" role="alert">
                {fieldError}
              </p>
            )}

            {/* NOT FOUND */}

            {notFound && (
              <div
                className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
                role="alert"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-400" />

                <div>
                  <p className="font-medium text-white">Not found</p>
                  <p className="mt-1 text-sm text-white/50">
                    No construction site exists with that ID. Check it and try
                    again.
                  </p>
                </div>
              </div>
            )}

            {/* SITE FOUND: CONFIRM BEFORE REQUESTING */}

            {lookup && (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 size={14} />
                  Site found
                </p>

                <p className="mt-3 text-lg font-medium text-white">
                  {lookup.site_name}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                  <MapPin size={14} className="shrink-0" />
                  {[lookup.location, lookup.city, lookup.country]
                    .filter(Boolean)
                    .join(', ') || 'Location not specified'}
                </p>

                {lookup.relationship ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-amber-400">
                    <ShieldAlert size={16} className="shrink-0" />
                    {RELATIONSHIP_MESSAGE[lookup.relationship]}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-white/45">
                    Is this the site you want to join? If so, send your request
                    to its owner.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={sending || !!lookup.relationship}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send size={16} />
                    {sending ? 'Sending...' : 'Request Access'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLookup(null);
                      setSiteId('');
                    }}
                    disabled={sending}
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/80 disabled:opacity-50"
                  >
                    Not this site
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY */}

          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Waiting for your decision',
                value: incoming.length,
                icon: <Inbox size={22} />,
              },
              {
                label: 'Requests you sent',
                value: sent.length,
                icon: <Send size={22} />,
              },
              {
                label: 'Approved',
                value: acceptedCount,
                icon: <Check size={22} />,
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`${CARD} flex items-center gap-4 p-5`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 text-[#4ADE80]">
                  {tile.icon}
                </div>

                <div>
                  <p className="text-xs text-white/45">{tile.label}</p>
                  <p className="mt-1 text-2xl font-medium text-white tabular-nums">
                    {loading ? '–' : tile.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {loadError && !loading && (
            <div className="mb-8 flex items-start gap-3 rounded-[24px] border border-red-500/20 bg-red-900/10 p-5">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-400" />

              <div className="flex-1">
                <p className="text-sm leading-6 text-slate-300">{loadError}</p>

                <button
                  onClick={handleRefresh}
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* INCOMING ACCESS REQUESTS */}

          <div className="mb-10">
            <SectionTitle
              icon={<Inbox size={17} />}
              title="Incoming Access Requests"
              count={loading ? undefined : incoming.length}
            />

            {loading ? (
              <EmptyState>Loading access requests...</EmptyState>
            ) : incoming.length === 0 ? (
              <EmptyState>You have no incoming access requests.</EmptyState>
            ) : (
              <div className="flex flex-col gap-4">
                {incoming.map((request) => {
                  const isBusy = busyId === request.request_id;
                  const isConfirming = confirmRejectId === request.request_id;

                  return (
                    <div
                      key={request.request_id}
                      className={`${CARD} flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6`}
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-sm font-semibold text-[#4ADE80]">
                          {getInitials(request)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {displayName(request)}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-white/50">
                            <Mail size={14} className="shrink-0" />
                            {request.requester_email}
                          </p>

                          <p className="mt-3 text-sm text-white/60">
                            wants access to{' '}
                            <span className="font-medium text-white">
                              {request.site_name}
                            </span>
                          </p>

                          <p className="mt-1 break-all font-mono text-xs text-white/30">
                            Site ID: {request.site_id}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                            <Clock size={12} />
                            Requested {formatDateTime(request.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                        {isConfirming ? (
                          <>
                            <span className="w-full text-sm text-white/60 sm:w-auto">
                              Reject this request?
                            </span>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(request, 'reject')}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-red-500/90 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                            >
                              <X size={15} />
                              {isBusy ? 'Rejecting...' : 'Yes, reject'}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmRejectId(null)}
                              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/80 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(request, 'accept')}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <Check size={15} />
                              {isBusy ? 'Approving...' : 'Approve'}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                setConfirmRejectId(request.request_id)
                              }
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <X size={15} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REQUESTS I SENT */}

          <div>
            <SectionTitle
              icon={<Send size={17} />}
              title="My Sent Requests"
              count={loading ? undefined : sent.length}
            />

            {loading ? (
              <EmptyState>Loading your requests...</EmptyState>
            ) : sent.length === 0 ? (
              <EmptyState>
                You haven't requested access to any site yet.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {sent.map((request) => (
                  <div
                    key={request.request_id}
                    className={`${CARD} flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {request.site_name}
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-white/30">
                        Site ID: {request.site_id}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                        <Clock size={12} />
                        Sent {formatDateTime(request.created_at)}
                      </p>
                    </div>

                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* TOAST NOTIFICATIONS */}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-[min(356px,calc(100vw-32px))] flex-col items-end gap-2.5 sm:bottom-8 sm:right-8">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <SwipeToast
              inline
              title={toast.title}
              description={toast.description}
              icon={TOAST_STYLE[toast.kind].icon}
              background="#141a2e"
              color="#f5f5f5"
              fuseColor={TOAST_STYLE[toast.kind].fuse}
              duration={toast.kind === 'success' ? 3500 : 5000}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default AccessRequests;
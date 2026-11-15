import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  FileText,
  MapPin,
  Edit2,
  CheckCircle2,
  Globe2,
  Lock,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Database,
  CalendarDays,
  Clock3,
  Bot,
} from 'lucide-react';

import api from '../api/axios';
import { updateSiteMetadata } from '../api/sites';
import DashboardNav from '../components/DashboardNav';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface ConstructionSite {
  construction_id: string;
  site_name: string;
  created_by: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  area: string | number | null;
  start_date: string;
  is_completed: boolean | null;
  end_date: string | null;
  is_public: boolean | null;
  created_at: string | null;
  center_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  extent_meters: number | null;
}

export interface ProgressLog {
  progress_id: string;
  construction: string | null;
  baseline_image_filename: string | null;
  latest_image_filename: string | null;
  change_mask_filename: string | null;
  area_changed_sqm: string | number | null;
  change_percentage: string | number | null;
  status: string;
  satellite_image_date: string;
  processed_at: string | null;
}

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

const formatDate = (date: string | null) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) return '—';

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatNumber = (value: number, decimals = 2) => {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
};

// ---------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------

function SiteDetails() {
  const { id } = useParams();

  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingArea, setIsEditingArea] = useState(false);
  const [editedArea, setEditedArea] = useState<string | number>('');
  const [editedStartDate, setEditedStartDate] = useState('');
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // FETCH SITE AND PROGRESS DATA
  // ---------------------------------------------------------

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await api.get('sites/');

        const mySites: ConstructionSite[] = response.data.my_sites || [];
        const sharedSites: ConstructionSite[] = response.data.shared_sites || [];

        const allSites = [...mySites, ...sharedSites];

        const selectedSite = allSites.find(
          (item) => String(item.construction_id) === id
        );

        if (selectedSite) {
          setSite(selectedSite);
          setEditedArea(selectedSite.area || '');
          setEditedStartDate(selectedSite.start_date);

          const isOwnedByMe = mySites.some(
            (item) => String(item.construction_id) === id
          );

          setIsOwner(isOwnedByMe);
        } else {
          setError('Site not found or you do not have access to it.');
          setLoading(false);
          return;
        }

        try {
          const logsResponse = await api.get(`sites/${id}/progress/`);
          const logsData =
            logsResponse.data.progress_logs || logsResponse.data;

          setProgressLogs(Array.isArray(logsData) ? logsData : []);
        } catch (logErr) {
          console.error('Error fetching progress logs:', logErr);
          setProgressLogs([]);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
          'Unable to load site details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // ---------------------------------------------------------
  // SITE UPDATE HANDLERS
  // ---------------------------------------------------------

  const handleToggleCompletion = async () => {
    if (!site || !isOwner) return;

    const newStatus = !site.is_completed;
    const previousSite = site;

    setSite({ ...site, is_completed: newStatus });

    try {
      await updateSiteMetadata(site.construction_id, {
        is_completed: newStatus,
      });
    } catch (err) {
      alert('Failed to update status.');
      setSite(previousSite);
    }
  };

  const handleToggleVisibility = async () => {
    if (!site || !isOwner) return;

    const newVisibility = !site.is_public;
    const previousSite = site;

    setSite({ ...site, is_public: newVisibility });

    try {
      await updateSiteMetadata(site.construction_id, {
        is_public: newVisibility,
      });
    } catch (err) {
      alert('Failed to update visibility.');
      setSite(previousSite);
    }
  };

  const handleSaveArea = async () => {
    if (!site || !isOwner) return;

    const previousArea = site.area;
    const updatedSite = { ...site, area: editedArea };

    setSite(updatedSite);
    setIsEditingArea(false);

    try {
      await updateSiteMetadata(site.construction_id, {
        area: editedArea,
      });
    } catch (err) {
      alert('Failed to update area.');
      setSite({ ...site, area: previousArea });
      setEditedArea(previousArea || '');
    }
  };

  const handleSaveStartDate = async () => {
    if (!site || !isOwner || !editedStartDate) return;

    const today = new Date();
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    if (editedStartDate > todayStr) {
      alert('The construction start date cannot be in the future.');
      return;
    }

    try {
      await updateSiteMetadata(site.construction_id, {
        start_date: editedStartDate,
      });

      setSite({
        ...site,
        start_date: editedStartDate,
      });

      alert('Construction start date updated successfully.');
    } catch (error: any) {
      alert(
        error.response?.data?.detail ||
        'Unable to update the construction start date.'
      );
    }
  };

  // ---------------------------------------------------------
  // LOADING AND ERROR STATES
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080A19] flex items-center justify-center">
        <p className="text-slate-400">Loading site details...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#080A19] flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-red-400 mb-3">
          Unable to Load Site
        </h2>

        <p className="text-red-300/80 mb-6">
          {error || 'Unknown error'}
        </p>

        <Link
          to="/construction-site/member"
          className="bg-slate-800 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Back to My Sites
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PROGRESS DATA AND CHART CALCULATIONS
  // ---------------------------------------------------------

  const completedLogs = progressLogs
    .filter((log) => log.status?.toLowerCase() === 'completed')
    .sort((a, b) => {
      const dateA = new Date(
        a.processed_at || a.satellite_image_date
      ).getTime();

      const dateB = new Date(
        b.processed_at || b.satellite_image_date
      ).getTime();

      return dateA - dateB;
    });

  const latestProgress =
    completedLogs.length > 0
      ? completedLogs[completedLogs.length - 1]
      : null;

  const previousProgress =
    completedLogs.length > 1
      ? completedLogs[completedLogs.length - 2]
      : null;

  // Latest successful baseline result, not the sum of all records.
  const totalAreaChanged = latestProgress
    ? Number(latestProgress.area_changed_sqm) || 0
    : 0;

  const latestPercentage = latestProgress
    ? Number(latestProgress.change_percentage) || 0
    : 0;

  const previousAreaChanged = previousProgress
    ? Number(previousProgress.area_changed_sqm) || 0
    : null;

  const areaChangedData = completedLogs.map(
    (log) => Number(log.area_changed_sqm) || 0
  );

  const changePercentageData = completedLogs.map(
    (log) => Number(log.change_percentage) || 0
  );

  const maxArea = Math.max(...areaChangedData, 1);

  const maxPercentage = Math.max(
    ...changePercentageData,
    1
  );

  const locationText =
    [site.location, site.city, site.country]
      .filter(Boolean)
      .join(', ') || 'Not specified';

  const chartPoints = changePercentageData.map((value, index) => {
    const x =
      changePercentageData.length === 1
        ? 400
        : 40 + (index / (changePercentageData.length - 1)) * 720;

    const y = 205 - (value / maxPercentage) * 165;

    return `${x},${y}`;
  });

  const lineChartPoints = chartPoints.join(' ');

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">

      <div className="relative z-10 flex flex-col min-h-screen">

        <DashboardNav />

        <main className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-10 sm:py-14 max-w-[1500px] mx-auto w-full">

          {/* -------------------------------------------------
              PAGE HEADER
          ------------------------------------------------- */}

          <div className="mb-9 flex flex-col lg:flex-row lg:items-end justify-between gap-6">

            <div className="animate-fade-up">

              <Link
                to="/construction-site/member"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
              >
                <ArrowLeft size={16} />
                Back to My Sites
              </Link>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-[#4ADE80] text-xs font-semibold uppercase tracking-[0.2em]">
                  Construction Monitoring
                </span>
              </div>

              <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-[1.1]">
                {site.site_name}
              </h1>

              <p className="text-white/40 text-xs sm:text-sm mt-3 font-mono break-all">
                ID: {site.construction_id}
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                onClick={() =>
                    navigate(`/construction-site/member/${site.construction_id}/monitor`)
                        }
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <Activity size={16} />
                Monitor Site now
              </button>

              <button
                className="flex items-center gap-2 bg-[#1a1820] hover:bg-[#27242f] text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <Bot size={16} />
                Run AI Analysis
              </button>

            </div>

          </div>

          {/* -------------------------------------------------
              SITE INFORMATION
          ------------------------------------------------- */}

          <div className="mb-10">

            <div className="flex items-center gap-2 mb-4">
              <Database size={17} className="text-[#4ADE80]" />

              <h2 className="text-white text-lg font-medium">
                Site Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

              {/* LOCATION */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-6 flex flex-col justify-between min-h-[150px]">

                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
                  <MapPin size={15} className="text-[#4ADE80]" />
                  Location
                </div>

                <p className="text-white text-base font-medium leading-relaxed">
                  {locationText}
                </p>

              </div>

              {/* TOTAL AREA */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-6 flex flex-col justify-between min-h-[150px]">

                <div className="flex justify-between items-center mb-4">

                  <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider">
                    <BarChart3 size={15} className="text-[#4ADE80]" />
                    Total Site Area
                  </div>

                  {isOwner && !isEditingArea && (
                    <button
                      onClick={() => setIsEditingArea(true)}
                      className="text-[#4ADE80] hover:text-white transition-colors"
                      title="Edit Area"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}

                </div>

                {isEditingArea ? (
                  <div className="flex gap-2">

                    <input
                      type="number"
                      value={editedArea}
                      onChange={(e) => setEditedArea(e.target.value)}
                      className="bg-slate-950/70 border border-[#15803D]/40 text-white px-3 py-2 rounded-lg text-sm w-full outline-none focus:border-[#4ADE80] transition-all"
                      placeholder="Area in sqm"
                    />

                    <button
                      onClick={handleSaveArea}
                      className="bg-[#15803D] hover:bg-[#16A34A] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Save
                    </button>

                  </div>
                ) : (
                  <p className="text-white text-2xl font-medium">
                    {site.area
                      ? `${formatNumber(Number(site.area))} m²`
                      : 'Not specified'}
                  </p>
                )}

              </div>

              {/* PROJECT STATUS */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-6 flex flex-col justify-between min-h-[150px]">

                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
                  <CheckCircle2 size={15} className="text-[#4ADE80]" />
                  Project Status
                </div>

                {isOwner ? (
                  <button
                    onClick={handleToggleCompletion}
                    className={`w-fit flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      site.is_completed
                        ? 'bg-emerald-500/10 text-[#4ADE80] border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {site.is_completed ? 'Completed' : 'Active'}
                  </button>
                ) : (
                  <div
                    className={`w-fit flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                      site.is_completed
                        ? 'bg-emerald-500/10 text-[#4ADE80] border border-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {site.is_completed ? 'Completed' : 'Active'}
                  </div>
                )}

              </div>

              {/* VISIBILITY */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-6 flex flex-col justify-between min-h-[150px]">

                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Globe2 size={15} className="text-[#4ADE80]" />
                  Visibility
                </div>

                {isOwner ? (
                  <button
                    onClick={handleToggleVisibility}
                    className={`w-fit flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      site.is_public
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {site.is_public ? (
                      <Globe2 size={16} />
                    ) : (
                      <Lock size={16} />
                    )}

                    {site.is_public ? 'Public' : 'Private'}
                  </button>
                ) : (
                  <div
                    className={`w-fit flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                      site.is_public
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {site.is_public ? (
                      <Globe2 size={16} />
                    ) : (
                      <Lock size={16} />
                    )}

                    {site.is_public ? 'Public' : 'Private'}
                  </div>
                )}

              </div>

            </div>

            {!isOwner && (
              <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm bg-[rgba(10,20,35,0.6)] p-4 rounded-xl border border-white/5 w-fit">
                <ShieldAlert size={16} className="text-sky-500" />

                You are viewing a shared site. Only the creator can modify site details.
              </div>
            )}

          </div>

          {/* -------------------------------------------------
              SITE PROGRESS AND BAR CHART
          ------------------------------------------------- */}

          <div className="mb-6 rounded-[24px] sm:rounded-[33px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-8">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-[#4ADE80]" />

                  <p className="text-white text-base sm:text-xl font-medium">
                    Site Progress
                  </p>
                </div>

                <p className="text-white/40 text-xs sm:text-sm">
                  Construction changes detected through satellite imagery
                </p>
              </div>

              {latestProgress && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <CalendarDays size={14} />

                  Latest image: {formatDate(latestProgress.satellite_image_date)}
                </div>
              )}

            </div>

            <div className="mb-2">

              <p className="text-white text-[36px] sm:text-[54px] font-normal leading-tight tracking-tight">
                {formatNumber(totalAreaChanged)}
                <span className="text-white/40 text-[25px] sm:text-[36px] ml-2">
                  m²
                </span>
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-3 mb-8">

              {latestProgress ? (
                <>
                  <span className="px-3 py-2 bg-[#15803D]/30 rounded-lg text-[#4ADE80] text-xs sm:text-sm font-medium">
                    {formatNumber(latestPercentage)}% change detected
                  </span>

                  <span className="text-white/50 text-xs sm:text-sm">
                    From project start to latest available imagery
                  </span>
                </>
              ) : (
                <span className="text-white/40 text-sm">
                  No completed monitoring analysis is available yet.
                </span>
              )}

            </div>

            {/* BAR GRAPH */}

            <div className="border-t border-white/5 pt-6">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Change Activity
                  </p>

                  <p className="text-white/35 text-xs mt-1">
                    Changed area recorded in each completed analysis
                  </p>
                </div>

                <BarChart3 size={18} className="text-[#4ADE80]" />

              </div>

              {completedLogs.length > 0 ? (
                <div className="w-full overflow-x-auto pb-2">

                  <div
                    className="flex items-end gap-[5px] sm:gap-[7px] h-[150px] sm:h-[190px] min-w-full"
                    style={{
                      minWidth:
                        completedLogs.length > 15
                          ? `${completedLogs.length * 32}px`
                          : '100%',
                    }}
                  >

                    {areaChangedData.map((value, index) => {
                      const heightPercent = Math.max(
                        (value / maxArea) * 100,
                        3
                      );

                      const isLatest = index === areaChangedData.length - 1;

                      return (
                        <div
                          key={completedLogs[index].progress_id}
                          className="group relative flex-1 min-w-[12px] h-full flex flex-col justify-end items-center"
                        >

                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 whitespace-nowrap rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white shadow-xl">
                            {formatNumber(value)} m²
                            <br />
                            {formatDate(
                              completedLogs[index].satellite_image_date
                            )}
                          </div>

                          <div
                            className={`w-full rounded-t-[3px] transition-all duration-500 ${
                              isLatest
                                ? 'bg-[#4ADE80] shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                                : 'bg-[#4ADE80]/45 hover:bg-[#4ADE80]/75'
                            }`}
                            style={{
                              height: `${heightPercent}%`,
                              minHeight: '4px',
                            }}
                          />

                        </div>
                      );
                    })}

                  </div>

                  <div className="flex justify-between gap-3 mt-3 text-[10px] sm:text-xs text-white/35">
                    <span>
                      {formatDate(completedLogs[0].satellite_image_date)}
                    </span>

                    <span>
                      {formatDate(
                        completedLogs[completedLogs.length - 1].satellite_image_date
                      )}
                    </span>
                  </div>

                </div>
              ) : (
                <div className="h-[150px] sm:h-[190px] flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/35 text-sm">
                    Your change activity graph will appear after monitoring.
                  </p>
                </div>
              )}

            </div>

            {/* PREVIOUS RESULT COMPARISON */}

            {latestProgress && previousAreaChanged !== null && (
              <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">

                <TrendingUp size={16} className="text-[#4ADE80]" />

                <span className="text-white/50">
                  Previous recorded result:
                </span>

                <span className="text-white/80 font-medium">
                  {formatNumber(previousAreaChanged)} m²
                </span>

              </div>
            )}

          </div>

          {/* -------------------------------------------------
              CHANGE TREND LINE GRAPH
          ------------------------------------------------- */}

          <div className="mb-10 rounded-[24px] sm:rounded-[33px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-8">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-[#4ADE80]" />

                  <p className="text-white text-base sm:text-xl font-medium">
                    Change Trend
                  </p>
                </div>

                <p className="text-white/40 text-xs sm:text-sm">
                  Percentage of site area identified as changed in each analysis
                </p>
              </div>

              {latestProgress && (
                <div className="rounded-lg bg-[#15803D]/20 border border-[#15803D]/30 px-4 py-2">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                    Latest change
                  </p>

                  <p className="text-[#4ADE80] text-xl font-medium">
                    {formatNumber(latestPercentage)}%
                  </p>
                </div>
              )}

            </div>

            {completedLogs.length > 0 ? (
              <div className="w-full">

                <div className="w-full overflow-x-auto">

                  <svg
                    viewBox="0 0 800 240"
                    preserveAspectRatio="none"
                    className="w-full min-w-[500px] h-[190px] sm:h-[260px] overflow-visible"
                  >

                    {/* GRID LINES */}

                    {[40, 82, 124, 166, 208].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        y1={y}
                        x2="760"
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                        strokeDasharray="4 5"
                      />
                    ))}

                    {/* AREA UNDER THE LINE */}

                    {completedLogs.length > 1 && (
                      <polygon
                        points={`40,208 ${lineChartPoints} 760,208`}
                        fill="rgba(74,222,128,0.09)"
                      />
                    )}

                    {/* LINE */}

                    {completedLogs.length > 1 && (
                      <polyline
                        points={lineChartPoints}
                        fill="none"
                        stroke="#4ADE80"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* DATA POINTS */}

                    {changePercentageData.map((value, index) => {
                      const x =
                        changePercentageData.length === 1
                          ? 400
                          : 40 +
                            (index / (changePercentageData.length - 1)) * 720;

                      const y = 205 - (value / maxPercentage) * 165;

                      return (
                        <g key={completedLogs[index].progress_id}>

                          <circle
                            cx={x}
                            cy={y}
                            r="10"
                            fill="rgba(74,222,128,0.13)"
                          />

                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#4ADE80"
                            stroke="#080A19"
                            strokeWidth="2"
                          />

                          <title>
                            {formatNumber(value)}% - {formatDate(
                              completedLogs[index].satellite_image_date
                            )}
                          </title>

                        </g>
                      );
                    })}

                  </svg>

                </div>

                <div className="flex justify-between gap-3 mt-3 text-[10px] sm:text-xs text-white/35">
                  <span>
                    {formatDate(completedLogs[0].satellite_image_date)}
                  </span>

                  <span>
                    {formatDate(
                      completedLogs[completedLogs.length - 1].satellite_image_date
                    )}
                  </span>
                </div>

              </div>
            ) : (
              <div className="h-[190px] sm:h-[260px] flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                <p className="text-white/35 text-sm">
                  Your change trend graph will appear after monitoring.
                </p>
              </div>
            )}

          </div>

          {/* -------------------------------------------------
              PROGRESS SUMMARY
          ------------------------------------------------- */}

          <div className="mb-10">

            <div className="flex items-center gap-2 mb-4">
              <Database size={17} className="text-[#4ADE80]" />

              <h2 className="text-white text-lg font-medium">
                Progress Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* TOTAL AREA CHANGED */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-6">

                <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-wider mb-5">
                  <BarChart3 size={15} className="text-[#4ADE80]" />
                  Total Area Changed
                </div>

                <p className="text-white text-3xl font-normal mb-2">
                  {formatNumber(totalAreaChanged)}
                  <span className="text-white/40 text-lg ml-2">m²</span>
                </p>

                <p className="text-white/35 text-xs leading-relaxed">
                  Latest successful baseline comparison.
                </p>

              </div>

              {/* CHANGE PERCENTAGE */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-6">

                <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-wider mb-5">
                  <TrendingUp size={15} className="text-[#4ADE80]" />
                  Change Percentage
                </div>

                <p className="text-white text-3xl font-normal mb-2">
                  {formatNumber(latestPercentage)}%
                </p>

                <p className="text-white/35 text-xs leading-relaxed">
                  Percentage of the monitored site area detected as changed.
                </p>

              </div>

              {/* ANALYSIS COUNT */}

              <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-6">

                <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-wider mb-5">
                  <Activity size={15} className="text-[#4ADE80]" />
                  Completed Analyses
                </div>

                <p className="text-white text-3xl font-normal mb-2">
                  {completedLogs.length}
                </p>

                <p className="text-white/35 text-xs leading-relaxed">
                  Total successfully completed monitoring records.
                </p>

              </div>

            </div>

          </div>

          {/* -------------------------------------------------
              PROGRESS LOG HISTORY
          ------------------------------------------------- */}

          <div className="w-full rounded-[24px] sm:rounded-[33px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 overflow-hidden mb-10">

            <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:p-7 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock3 size={17} className="text-[#4ADE80]" />

                  <h2 className="text-white text-lg sm:text-xl font-medium">
                    Progress Logs History
                  </h2>
                </div>

                <p className="text-sm text-white/40">
                  History of satellite image analysis performed for this site.
                </p>
              </div>

              <span className="w-fit rounded-full border border-[#15803D]/30 bg-[#15803D]/10 px-4 py-2 text-xs text-[#4ADE80]">
                {progressLogs.length}{' '}
                {progressLogs.length === 1 ? 'Record' : 'Records'}
              </span>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-left">

                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Image Date
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Area Changed
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Change
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Processed At
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {[...progressLogs]
                    .sort((a, b) => {
                      const dateA = new Date(
                        a.processed_at || a.satellite_image_date
                      ).getTime();

                      const dateB = new Date(
                        b.processed_at || b.satellite_image_date
                      ).getTime();

                      return dateB - dateA;
                    })
                    .map((log) => {
                      const status = (log.status || '').toLowerCase();

                      return (
                        <tr
                          key={log.progress_id}
                          className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                        >

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-white/75">
                            {formatDate(log.satellite_image_date)}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                status === 'completed'
                                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : status === 'processing'
                                  ? 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                                  : 'border border-red-500/20 bg-red-500/10 text-red-400'
                              }`}
                            >
                              {log.status || 'Unknown'}
                            </span>

                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-white">
                            {log.area_changed_sqm != null
                              ? `${formatNumber(Number(log.area_changed_sqm))} m²`
                              : '—'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-white/70">
                            {log.change_percentage != null
                              ? `${Number(log.change_percentage).toFixed(2)}%`
                              : '—'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-white/45">
                            {log.processed_at
                              ? formatDate(log.processed_at)
                              : 'Not processed yet'}
                          </td>

                        </tr>
                      );
                    })}

                </tbody>

              </table>

              {progressLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-14 text-center">

                  <Activity className="mb-3 h-8 w-8 text-white/25" />

                  <p className="text-sm font-medium text-white/70">
                    No progress records yet
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Run site monitoring to generate your first progress record.
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* -------------------------------------------------
              SITE MONITORING INFORMATION
          ------------------------------------------------- */}

          <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-7">

            <div className="flex items-center gap-2 mb-5">
              <CalendarDays size={17} className="text-[#4ADE80]" />

              <h2 className="text-white text-lg font-medium">
                Project Timeline
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">
                  Construction Start Date
                </label>

                {isOwner ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="date"
                      value={editedStartDate}
                      max={new Date().toLocaleDateString('en-CA')}
                      onChange={(e) => setEditedStartDate(e.target.value)}
                      className="bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                    />

                    <button
                      onClick={handleSaveStartDate}
                      disabled={
                        !editedStartDate ||
                        editedStartDate === site?.start_date
                      }
                      className="px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold disabled:opacity-40"
                    >
                      Save Date
                    </button>
                  </div>
                ) : (
                  <p className="text-white">
                    {formatDate(site?.start_date)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
                  Construction End Date
                </p>

                <p className="text-white text-base">
                  {site.end_date
                    ? formatDate(site.end_date)
                    : 'Not specified'}
                </p>
              </div>

            </div>

          </div>

        </main>

      </div>

    </section>
  );
}

export default SiteDetails;
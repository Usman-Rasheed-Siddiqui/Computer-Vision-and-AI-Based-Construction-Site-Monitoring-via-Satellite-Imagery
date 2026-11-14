import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Activity, FileText, BarChart3, TrendingUp, Database, 
  MapPin, Edit2, CheckCircle2, Globe2, Lock, ShieldAlert
} from 'lucide-react';

import api from '../api/axios';
import { updateSiteMetadata } from '../api/sites'; // Make sure this is exported from your sites.ts
import DashboardNav from '../components/DashboardNav';
import MagicBento, { type MagicBentoItem } from '../components/MagicBento';

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
  current_progress: string | number | null;
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
// COMPONENT
// ---------------------------------------------------------
function SiteDetails() {
  const { id } = useParams();

  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields state
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [editedArea, setEditedArea] = useState<string | number>('');

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
          
          // Determine ownership: if it exists in my_sites, the current user is the creator
          const isOwnedByMe = mySites.some(item => String(item.construction_id) === id);
          setIsOwner(isOwnedByMe);
        } else {
          setError('Site not found or you do not have access to it.');
          setLoading(false);
          return;
        }

        try {
          const logsResponse = await api.get(`sites/${id}/progress/`);
          const logsData = logsResponse.data.progress_logs || logsResponse.data;
          setProgressLogs(Array.isArray(logsData) ? logsData : []);
        } catch (logErr) {
          console.error('No progress logs found or error fetching them.');
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

  // --- SECURE UPDATE HANDLERS ---
  const handleToggleCompletion = async () => {
    if (!site || !isOwner) return;
    const newStatus = !site.is_completed;
    
    // Optimistic UI update
    setSite({ ...site, is_completed: newStatus });
    try {
      await updateSiteMetadata(site.construction_id, { is_completed: newStatus });
    } catch (err) {
      alert("Failed to update status.");
      setSite({ ...site, is_completed: !newStatus }); // Revert on failure
    }
  };

  const handleToggleVisibility = async () => {
    if (!site || !isOwner) return;
    const newVisibility = !site.is_public;
    
    setSite({ ...site, is_public: newVisibility });
    try {
      await updateSiteMetadata(site.construction_id, { is_public: newVisibility });
    } catch (err) {
      alert("Failed to update visibility.");
      setSite({ ...site, is_public: !newVisibility });
    }
  };

  const handleSaveArea = async () => {
    if (!site || !isOwner) return;
    
    const previousArea = site.area;
    setSite({ ...site, area: editedArea });
    setIsEditingArea(false);
    
    try {
      await updateSiteMetadata(site.construction_id, { area: editedArea });
    } catch (err) {
      alert("Failed to update area.");
      setSite({ ...site, area: previousArea });
    }
  };

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
        <h2 className="text-2xl font-bold text-red-400 mb-3">Unable to Load Site</h2>
        <p className="text-red-300/80 mb-6">{error || 'Unknown error'}</p>
        <Link 
          to="/construction-site/member" 
          className="bg-slate-800 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Back to My Sites
        </Link>
      </div>
    );
  }

  // Calculate Chart Data
  const areaChangedData = progressLogs.map(log => Number(log.area_changed_sqm) || 0);
  const changePercentageData = progressLogs.map(log => Number(log.change_percentage) || 0);
  const logDates = progressLogs.map(log => new Date(log.satellite_image_date).toLocaleDateString());
  const totalAreaChanged = areaChangedData.reduce((acc, curr) => acc + curr, 0);

  const bentoItems: MagicBentoItem[] = [
    {
      id: 'bar-chart',
      label: 'Change Activity',
      title: 'Area Changed (Bar)',
      description: 'Square meters modified per scan.',
      icon: <BarChart3 size={16} />,
      visual: 'dashboard',
      colSpan: 1,
      rowSpan: 1,
      chartData: areaChangedData,
      chartLabels: logDates,
      chartSuffix: ' sqm'
    },
    {
      id: 'line-chart',
      label: 'Trend Analysis',
      title: 'Change Percentage (Line)',
      description: 'AI detected change trend over time.',
      icon: <TrendingUp size={16} />,
      visual: 'analytics',
      colSpan: 1,
      rowSpan: 1,
      chartData: changePercentageData,
      chartLabels: logDates,
      chartSuffix: '%'
    },
    {
      id: 'total-area',
      colSpan: 2,
      rowSpan: 1,
      content: (
        <div className="flex flex-col justify-center h-full p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
            <Database size={18} className="text-sky-400" />
            Total Area Changed (Cumulative)
          </div>
          <div className="text-5xl font-bold text-white tracking-tight mb-2">
            {totalAreaChanged.toLocaleString()} <span className="text-2xl text-slate-500 font-medium">sqm</span>
          </div>
          <p className="text-sm text-slate-400">
            Across {progressLogs.length} total satellite image scans processed by AI.
          </p>
        </div>
      )
    },
    {
      id: 'data-table',
      colSpan: 4,
      rowSpan: 2,
      content: (
        <div className="flex flex-col h-full overflow-hidden p-2">
          <h3 className="text-lg font-bold text-slate-100 mb-4 px-2">Progress Logs History</h3>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {progressLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No progress logs recorded for this site yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
                <thead className="sticky top-0 bg-[#121116] z-10 text-slate-400">
                  <tr>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">ID</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Status</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Sat. Date</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Processed At</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Area Changed</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Change %</th>
                    <th className="pb-3 px-3 font-semibold border-b border-white/10">Baseline File</th>
                  </tr>
                </thead>
                <tbody>
                  {progressLogs.map((log) => (
                    <tr key={log.progress_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 border-b border-white/5 font-mono text-xs">{log.progress_id.slice(0, 8)}...</td>
                      <td className="py-3 px-3 border-b border-white/5">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-white/5">{new Date(log.satellite_image_date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 border-b border-white/5">{log.processed_at ? new Date(log.processed_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-3 border-b border-white/5">{log.area_changed_sqm ?? '-'} sqm</td>
                      <td className="py-3 px-3 border-b border-white/5">{log.change_percentage ?? '-'}%</td>
                      <td className="py-3 px-3 border-b border-white/5 font-mono text-xs truncate max-w-[120px]">{log.baseline_image_filename || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <div className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-16 max-w-[1400px] mx-auto w-full">
          
          {/* Header & Back Link */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="animate-fade-up">
              <Link to="/construction-site/member" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
                <ArrowLeft size={16} />
                Back to My Sites
              </Link>
              <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-[1.1]">
                {site.site_name}
              </h1>
              <p className="text-white/60 text-[15px] sm:text-[16px] mt-2 font-mono">
                ID: {site.construction_id}
              </p>
            </div>

            <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <button 
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <Activity size={16} />
                Monitor Site now
              </button>
              <button 
                className="flex items-center gap-2 bg-[#1a1820] hover:bg-[#27242f] text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <FileText size={16} />
                Generate Report
              </button>
            </div>
          </div>

          {/* SITE OVERVIEW METADATA & EDITABLE FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up" style={{ animationDelay: '150ms' }}>
            
            {/* Location (Combined) */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <MapPin size={14} /> Location
              </div>
              <div className="text-slate-100 text-sm font-medium line-clamp-2">
                {[site.location, site.city, site.country].filter(Boolean).join(', ') || 'Not specified'}
              </div>
            </div>

            {/* Area (Editable only if owner) */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Area</div>
                {isOwner && !isEditingArea && (
                  <button onClick={() => setIsEditingArea(true)} className="text-sky-400 hover:text-sky-300 transition-colors" title="Edit Area">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              {isEditingArea ? (
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={editedArea} 
                    onChange={e => setEditedArea(e.target.value)} 
                    className="bg-slate-950/50 border border-slate-700 text-slate-200 px-3 py-1 rounded-lg text-sm w-full outline-none focus:border-sky-500 transition-all" 
                    placeholder="sqm"
                  />
                  <button onClick={handleSaveArea} className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                    Save
                  </button>
                </div>
              ) : (
                <div className="text-slate-100 text-sm font-medium">
                  {site.area ? `${site.area} sqm` : 'Not specified'}
                </div>
              )}
            </div>

            {/* Project Status (Toggle only if owner) */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-center items-start">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Project Status</div>
              {isOwner ? (
                <button 
                  onClick={handleToggleCompletion} 
                  className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    site.is_completed 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {site.is_completed ? 'Completed' : 'Active'}
                </button>
              ) : (
                <div className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold ${
                  site.is_completed ? 'bg-emerald-500/5 text-emerald-400/80 border border-emerald-500/10' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                }`}>
                  <CheckCircle2 size={16} />
                  {site.is_completed ? 'Completed' : 'Active'}
                </div>
              )}
            </div>

            {/* Visibility (Toggle only if owner) */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-center items-start">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Visibility</div>
              {isOwner ? (
                <button 
                  onClick={handleToggleVisibility} 
                  className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    site.is_public 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {site.is_public ? <Globe2 size={16} /> : <Lock size={16} />}
                  {site.is_public ? 'Public' : 'Private'}
                </button>
              ) : (
                <div className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold ${
                  site.is_public ? 'bg-sky-500/5 text-sky-400/80 border border-sky-500/10' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                }`}>
                  {site.is_public ? <Globe2 size={16} /> : <Lock size={16} />}
                  {site.is_public ? 'Public' : 'Private'}
                </div>
              )}
            </div>

          </div>

          {!isOwner && (
             <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm bg-slate-900/40 p-3 rounded-lg border border-white/5 w-fit">
               <ShieldAlert size={16} className="text-sky-500" />
               You are viewing a shared site. Only the creator can modify site details.
             </div>
          )}

          {/* Magic Bento Grid */}
          <div className="w-full animate-fade-up" style={{ animationDelay: '200ms' }}>
            <MagicBento
              items={bentoItems}
              columns={4}
              rowHeight={200}
              gap={16}
              radius={20}
              theme="dark"
              glowColor="#38bdf8"
              enableBorderGlow={true}
              enableSpotlight={true}
              spotlightRadius={300}
              clickEffect={true}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default SiteDetails;
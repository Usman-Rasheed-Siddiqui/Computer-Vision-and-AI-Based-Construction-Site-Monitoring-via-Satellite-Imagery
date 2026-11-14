import { useEffect, useState } from 'react';
import { MapPin, Calendar, Trash2, Building2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import api from '../api/axios';
import SpotlightCard from '../components/SpotlightCard'; 
import JellyRadio from '../components/JellyRadio';       
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
  current_progress: string | number | null;
  center_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  extent_meters: number | null;
}

// ---------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------
function MySites() {
  const [viewMode, setViewMode] = useState('my-sites');

  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [sharedSites, setSharedSites] = useState<ConstructionSite[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch ALL categorized sites in one single request
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await api.get('sites/');
        
        // Populate the separate states based on the backend's categorization
        setSites(response.data.my_sites || []);
        setSharedSites(response.data.shared_sites || []);
      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
          'Unable to load construction sites. Please login again if your session has expired.'
        );
        setSites([]);
        setSharedSites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this construction site?');
    if (!confirmed) return;
    try {
      await api.delete(`sites/${id}/`);
      setSites((previousSites) => previousSites.filter((site) => site.construction_id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Unable to delete construction site. Please try again.');
    }
  };

  // ---------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------
  const renderSiteCard = (site: ConstructionSite, isShared = false) => {
    const lat = site.center_coordinates?.latitude ?? 0;
    const lng = site.center_coordinates?.longitude ?? 0;
    const displayDate = site.created_at ? new Date(site.created_at).toLocaleDateString() : 'Unknown';

    return (
      <SpotlightCard
        key={site.construction_id}
        theme="dark"
        spotlightColor="#ffffff"
        intensity={0.15}
        className="flex flex-col h-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700/30 text-slate-300 border border-slate-600/30">
            <Building2 size={24} />
          </div>

          {!isShared && (
            <button
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
              onClick={() => handleDelete(site.construction_id)}
              title="Delete site"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2 relative z-10">{site.site_name}</h2>

        {isShared && (
          <span className="inline-block bg-slate-700/30 text-slate-300 border border-slate-600/30 px-3 py-1 rounded-md text-xs font-semibold mb-3 w-max relative z-10">
            Shared with you
          </span>
        )}

        <div className="space-y-3 mt-2 mb-6 flex-grow relative z-10">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin size={16} className="text-slate-400" />
            <span>{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={16} className="text-slate-400" />
            <span>Created: {displayDate}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 relative z-10">
          <div 
            className="text-xs text-slate-500 font-mono break-all sm:truncate sm:mr-3" 
            title={site.construction_id}
          >
            ID: {site.construction_id}
          </div>
          <Link
            to={`/construction-site/member/${site.construction_id}`}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-slate-700/30 hover:bg-slate-600/40 text-slate-200 border border-slate-600/50 rounded-lg text-sm font-semibold transition-all shrink-0 w-full sm:w-auto"
          >
            <Eye size={16} />
            View
          </Link>
        </div>
      </SpotlightCard>
    );
  };

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <div className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-16 max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h1 className="text-white text-[40px] sm:text-[56px] font-normal leading-[1.1] mb-4 animate-fade-up">
              My Sites
            </h1>
            <p className="text-white/60 text-[16px] sm:text-[18px] max-w-[500px] mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
              Monitor your registered construction sites or workspaces that have been shared with you.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <JellyRadio
              items={[
                { value: 'my-sites', label: 'My Registered Sites' },
                { value: 'shared', label: 'Shared With Me' }
              ]}
              value={viewMode}
              onChange={(val: string) => setViewMode(val)}
              chipColor="rgba(30, 41, 59, 0.4)" 
              activeColor="rgba(239, 68, 68, 0.15)" 
              textColor="#94a3b8" 
              activeTextColor="#f87171" 
              size="md"
            />
          </div>

          {viewMode === 'my-sites' ? (
            <>
              {loading ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10 text-center mb-8">
                  <p className="text-slate-400">Loading your construction sites...</p>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-10 text-center mb-8 relative z-20">
                  <h2 className="text-lg font-bold text-red-400 mb-2">Unable to Load Sites</h2>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              ) : sites.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center mb-8 relative z-20">
                  <div className="flex items-center justify-center w-16 h-16 bg-slate-700/30 text-slate-300 border border-slate-600/30 rounded-2xl mb-5">
                    <Building2 size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-200 mb-2">No Construction Sites Yet</h2>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    You haven't registered any construction sites. Start by adding your first project.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
                  {sites.map((site) => renderSiteCard(site))}
                </div>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10 text-center mb-12">
                  <p className="text-slate-400">Loading shared sites...</p>
                </div>
              ) : sharedSites.length === 0 ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10 text-center mb-12 relative z-20">
                  <p className="text-slate-400">No sites have been shared with you yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
                  {sharedSites.map((site) => renderSiteCard(site, true))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default MySites;
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, PlayCircle, Loader2, Bot, 
  Satellite, Layers, DatabaseZap, Clock, ShieldAlert
} from 'lucide-react';

import api from '../api/axios';
import DashboardNav from '../components/DashboardNav';

interface ConstructionSite {
  construction_id: string;
  site_name: string;
  start_date: string;
}

export default function MonitorSite() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Workflow States
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [earlierDate, setEarlierDate] = useState('');
  const [laterDate, setLaterDate] = useState('');
  
  // Submission States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch site info to get the start_date boundary
  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await api.get('sites/');
        const mySites = response.data.my_sites || [];
        const sharedSites = response.data.shared_sites || [];
        const allSites = [...mySites, ...sharedSites];
        
        const found = allSites.find(s => String(s.construction_id) === id);
        if (found) {
          setSite(found);
          setEarlierDate(found.start_date);
          setLaterDate(todayStr);
        } else {
          setError('Site not found.');
        }
      } catch (err) {
        setError('Unable to load site details.');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchSite();
  }, [id, todayStr]);

  // Handle Mode Switch
  useEffect(() => {
    if (mode === 'auto' && site) {
      setEarlierDate(site.start_date);
      setLaterDate(todayStr);
    }
  }, [mode, site, todayStr]);

  const handleRunMonitor = async () => {
    if (!earlierDate || !laterDate) {
      setError("Please select both dates.");
      return;
    }
    if (earlierDate >= laterDate) {
      setError("The later date must be chronologically after the earlier date.");
      return;
    }

    setError('');
    setIsProcessing(true);

    // Fake progress steps for UI (we will connect the actual API later)
    setProcessStep(1); // Fetching ArcGIS
    setTimeout(() => setProcessStep(2), 2500); // Running ML Model
    setTimeout(() => setProcessStep(3), 6000); // Saving to Supabase & DB

    try {
      /* 
       * TODO: WE WILL WIRE THIS TO THE DJANGO BACKEND LATER
       * 
       * await api.post(`/sites/${id}/monitor/`, {
       *   earlier_date: earlierDate,
       *   later_date: laterDate
       * });
       */

      // Simulate network request time for now
      await new Promise(resolve => setTimeout(resolve, 8000));

      // On Success, redirect back to details to view the new progress log
      navigate(`/construction-site/member/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred during the ML pipeline.");
      setIsProcessing(false);
      setProcessStep(0);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#080A19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#080A19] flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-slate-100 font-sans">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <div className="flex-1 flex flex-col px-5 sm:px-8 md:px-[82px] py-16 max-w-4xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <Link 
              to={`/construction-site/member/${id}`} 
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Site Details
            </Link>
            <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-[1.1]">
              Monitor Progress
            </h1>
            <p className="text-slate-400 text-[15px] sm:text-[16px] mt-2">
              Run the AI model on {site.site_name} to detect construction changes over time.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm animate-fade-up">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing ? (
            /* LOADING STATE - ML PIPELINE */
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl animate-fade-up">
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <Bot className="w-8 h-8 text-emerald-400 relative z-10 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-6">Running AI Analysis Pipeline</h2>
              
              <div className="w-full max-w-md space-y-4 text-left">
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${processStep >= 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/30 border-white/5 text-slate-500'}`}>
                  <Satellite size={20} className={processStep === 1 ? "animate-pulse" : ""} />
                  <span className="text-sm font-medium">1. Extracting 500m ArcGIS Wayback imagery</span>
                </div>
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${processStep >= 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/30 border-white/5 text-slate-500'}`}>
                  <Layers size={20} className={processStep === 2 ? "animate-pulse" : ""} />
                  <span className="text-sm font-medium">2. Running Big Transfer (BiT) Model & Generating Masks</span>
                </div>
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${processStep >= 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/30 border-white/5 text-slate-500'}`}>
                  <DatabaseZap size={20} className={processStep === 3 ? "animate-pulse" : ""} />
                  <span className="text-sm font-medium">3. Calculating area and saving to database</span>
                </div>
              </div>
            </div>
          ) : (
            /* CONFIGURATION UI */
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-up" style={{ animationDelay: '100ms' }}>
              
              <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/5 mb-8 w-fit">
                <button 
                  onClick={() => setMode('auto')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'auto' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Automatic
                </button>
                <button 
                  onClick={() => setMode('custom')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'custom' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Custom Dates
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Earlier Date */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    Earlier Baseline Date
                  </label>
                  <input 
                    type="date" 
                    value={earlierDate}
                    min={site.start_date}
                    max={todayStr}
                    onChange={(e) => setEarlierDate(e.target.value)}
                    disabled={mode === 'auto'}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                  {mode === 'auto' && <p className="text-xs text-slate-500 mt-1">Locked to project start date.</p>}
                </div>

                {/* Later Date */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-400" />
                    Later Comparison Date
                  </label>
                  <input 
                    type="date" 
                    value={laterDate}
                    min={earlierDate || site.start_date}
                    max={todayStr}
                    onChange={(e) => setLaterDate(e.target.value)}
                    disabled={mode === 'auto'}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                  {mode === 'auto' && <p className="text-xs text-slate-500 mt-1">Locked to today's date.</p>}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={handleRunMonitor}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3.5 rounded-xl text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  <PlayCircle size={20} />
                  Run AI Monitor
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </section>
  );
}
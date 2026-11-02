import { Link } from 'react-router-dom';
import { Activity, MapPinPlus, Users } from 'lucide-react';
import DashboardNav from '../components/DashboardNav';
import PixelCard from '../components/PixelCard/PixelCard';

export default function ConstructionSite() {
  return (
    <section className="relative w-full min-h-screen bg-[#080A19]">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 md:px-[82px] py-16">
          
          {/* Header Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-white text-[40px] sm:text-[56px] font-normal leading-[1.1] mb-4 animate-fade-up">
              Construction Sites
            </h1>
            <p className="text-white/60 text-[16px] sm:text-[18px] max-w-[500px] mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
              Monitor registered sites, evaluate AI-driven change detection, or establish new workspaces.
            </p>
          </div>

          {/* Pixel Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
            
            {/* 1. View Construction Site (Blue Theme) */}
            <Link to="/construction-site/member" className="group block focus:outline-none animate-fade-up" style={{ animationDelay: '200ms' }}>
              <PixelCard
                colors={['#475569', '#64748B', '#94A3B8']}
                trigger="hover"
                style={{ width: '100%', height: '380px' }}
                className="w-full flex flex-col items-center justify-center text-center px-6 sm:px-8 border border-white/5 transition-all duration-300 hover:border-white/20"
              >
                <div className="w-14 h-14 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center mb-6">
                  <Activity className="w-7 h-7 text-[#0ea5e9]" />
                </div>
                <h2 className="text-2xl font-medium text-white mb-3">View Your Sites</h2>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  Access your dashboard to monitor registered sites, review AI-detected changes over time, and generate progress reports.
                </p>
              </PixelCard>
            </Link>

            {/* 2. Register Construction Site (Green Theme) */}
            <Link to="/construction-site/register" className="group block focus:outline-none animate-fade-up" style={{ animationDelay: '300ms' }}>
              <PixelCard
                colors={['#475569', '#64748B', '#94A3B8']}
                trigger="hover"
                style={{ width: '100%', height: '380px' }}
                className="w-full flex flex-col items-center justify-center text-center px-6 sm:px-8 border border-white/5 transition-all duration-300 hover:border-white/20"
              >
                <div className="w-14 h-14 rounded-full bg-[#15803D]/20 flex items-center justify-center mb-6">
                  <MapPinPlus className="w-7 h-7 text-[#4ADE80]" />
                </div>
                <h2 className="text-2xl font-medium text-white mb-3">Register Site</h2>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  Create a new monitoring workspace by providing geographical bounding-box coordinates and start dates via map validation.
                </p>
              </PixelCard>
            </Link>

            {/* 3. Join a Construction Site (Brown/Gold Theme) */}
            <Link to="/construction-site/join" className="group block focus:outline-none animate-fade-up" style={{ animationDelay: '400ms' }}>
              <PixelCard
                colors={['#475569', '#64748B', '#94A3B8']}
                trigger="hover"
                style={{ width: '100%', height: '380px' }}
                className="w-full flex flex-col items-center justify-center text-center px-6 sm:px-8 border border-white/5 transition-all duration-300 hover:border-white/20"
              >
                <div className="w-14 h-14 rounded-full bg-[#8B4513]/20 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-[#CD853F]" />
                </div>
                <h2 className="text-2xl font-medium text-white mb-3">Join a Site</h2>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  Request access to an existing construction workspace using its unique site identifier. Collaborate pending approval.
                </p>
              </PixelCard>
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}
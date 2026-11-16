import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from '../components/DashboardNav';

// Sample data for the preview card. It follows the same rules as the real
// Site Progress card: one bar per completed analysis, the bar is the area that
// looked different between two satellite images, and the percentage is that
// area as a share of the monitored site (500 m x 500 m here).
const SITE_AREA_SQM = 250000;
const SAMPLE_START_DATE = '12 Jan 2026';

const SAMPLE_ANALYSES = [
  { date: '10 Feb 2026', percent: 0.9 },
  { date: '12 Mar 2026', percent: 1.6 },
  { date: '09 Apr 2026', percent: 1.4 },
  { date: '14 May 2026', percent: 2.3 },
  { date: '11 Jun 2026', percent: 2.8 },
  { date: '09 Jul 2026', percent: 3.4 },
  { date: '13 Aug 2026', percent: 3.1 },
  { date: '10 Sep 2026', percent: 3.9 },
].map((item) => ({
  ...item,
  area: Math.round((item.percent / 100) * SITE_AREA_SQM),
}));

function Animate({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
}) {
  const directionClass = {
    up: 'animate-fade-up',
    down: 'animate-fade-down',
    left: 'animate-fade-left',
    right: 'animate-fade-right',
    scale: 'animate-fade-scale',
  }[direction];

  return (
    <div
      className={`opacity-0 ${directionClass} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ProgressCard() {
  const maxArea = Math.max(...SAMPLE_ANALYSES.map((item) => item.area), 1);

  const latest = SAMPLE_ANALYSES[SAMPLE_ANALYSES.length - 1];
  const previous = SAMPLE_ANALYSES[SAMPLE_ANALYSES.length - 2];

  return (
    <Animate delay={900} direction="scale" className="w-full max-w-[405px] mx-auto lg:mx-0">
      <div className="w-full rounded-[24px] sm:rounded-[33px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-8 pb-5 sm:pb-6">

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-white text-[16px] sm:text-[20px] font-[450] leading-[20px]">
            Site Progress
          </p>

          <span className="rounded-full border border-white/15 px-[9px] py-[3px] text-[9px] sm:text-[10px] font-[450] uppercase tracking-[0.12em] text-white/50">
            Sample
          </span>
        </div>

        <p className="mb-2 sm:mb-3">
          <span className="text-white text-[28px] sm:text-[46px] font-[450] leading-[1]">
            {latest.area.toLocaleString('en-US')}
          </span>
          <span className="text-white/40 text-[28px] sm:text-[46px] font-[450] leading-[1]"> m²</span>
        </p>

        <div className="flex flex-wrap items-center gap-[10px] mb-6 sm:mb-8">
          <span className="px-[6px] py-[7px] bg-[#15803D]/30 rounded-[6px] text-[#4ADE80] text-[12px] sm:text-[14px] font-[450] leading-[14px]">
            {latest.percent}% change detected
          </span>
          <span className="text-white/80 text-[12px] sm:text-[14px] font-[450] leading-[14px] opacity-70">
            previous result: {previous.area.toLocaleString('en-US')} m²
          </span>
        </div>

        <div>
          <div className="flex items-end gap-[5px] sm:gap-[7px] h-[80px] sm:h-[100px]">
            {SAMPLE_ANALYSES.map((item, i) => {
              const isLatest = i === SAMPLE_ANALYSES.length - 1;
              const heightPercent = Math.max((item.area / maxArea) * 100, 3);

              return (
                <div
                  key={item.date}
                  className="flex-1 rounded-t-[3px] animate-bar-grow origin-bottom"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isLatest ? '#4ADE80' : 'rgba(74,222,128,0.45)',
                    boxShadow: isLatest ? '0 0 12px rgba(74,222,128,0.25)' : undefined,
                    animationDelay: `${1100 + i * 60}ms`,
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-3 text-[9px] sm:text-[10px] font-[450] leading-[10px] text-white/50">
            <span>{SAMPLE_ANALYSES[0].date}</span>
            <span>{latest.date}</span>
          </div>
        </div>
      </div>
    </Animate>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#080A19]">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://www.pexels.com/download/video/31147187/"
        autoPlay
        loop
        muted
        playsInline
      />
      
      <div className="relative z-10 h-full flex flex-col">
        <DashboardNav />

        <div className="flex-1 flex items-center py-8">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            
            <div className="max-w-[593px]">
              <Animate delay={300} direction="up">
                <h1 className="text-white text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal leading-[0.95] mb-5 sm:mb-8">
                  Automated satellite intelligence for construction
                </h1>
              </Animate>

              <Animate delay={500} direction="up">
                <p className="text-white/80 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.3] max-w-[370px] mb-7 sm:mb-10">
                  Analyze satellite imagery, generate automated change reports, and track physical progress with precision.
                </p>
              </Animate>

              <Animate delay={700} direction="up">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <button onClick={() => navigate('/construction-site/register')} className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#15803D] rounded-[12px] text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90">
                    Register Site
                  </button>
                  <button onClick={() => navigate('/construction-site/member-request')} className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-[#15803D] bg-[#15803D]/10 text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:bg-[#15803D]/20">
                    Join Live Site
                  </button>
                </div>
              </Animate>
            </div>

            <ProgressCard />
          </div>
        </div>
      </div>
    </section>
  );
}
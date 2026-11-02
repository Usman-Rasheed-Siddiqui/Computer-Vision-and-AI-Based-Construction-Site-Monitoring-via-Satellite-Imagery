import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from '../components/DashboardNav';

const BAR_HEIGHTS = [
  23, 40, 53, 40, 33, 14, 7, 17, 75, 65,
  88, 75, 65, 47, 33, 88, 4, 7, 9, 14,
  95, 65, 79, 37, 7, 40, 17, 20, 62, 47,
  92, 72,
];

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
  const maxHeight = Math.max(...BAR_HEIGHTS);

  return (
    <Animate delay={900} direction="scale" className="w-full max-w-[405px] mx-auto lg:mx-0">
      <div className="w-full rounded-[24px] sm:rounded-[33px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 p-5 sm:p-8 pb-5 sm:pb-6">
        
        <p className="text-white text-[16px] sm:text-[20px] font-[450] leading-[20px] mb-3 sm:mb-4">
          Site Progress
        </p>

        <p className="mb-2 sm:mb-3">
          <span className="text-white text-[28px] sm:text-[46px] font-[450] leading-[1]">8,450</span>
          <span className="text-white/40 text-[28px] sm:text-[46px] font-[450] leading-[1]"> sq m</span>
        </p>

        <div className="flex items-center gap-[10px] mb-6 sm:mb-8">
          <span className="px-[6px] py-[7px] bg-[#15803D]/30 rounded-[6px] text-[#4ADE80] text-[12px] sm:text-[14px] font-[450] leading-[14px]">
            +12.4% change
          </span>
          <span className="text-white/80 text-[12px] sm:text-[14px] font-[450] leading-[14px] opacity-70">
            vs. previous scan (7,515 sq m)
          </span>
        </div>

        <div className="relative">
          <div className="flex items-end gap-[1.5px] h-[80px] sm:h-[100px]">
            {BAR_HEIGHTS.map((h, i) => {
              const isProjected = i >= 28;
              const heightPercent = (h / maxHeight) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-[0.5px] animate-bar-grow origin-bottom"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isProjected ? 'rgba(74,222,128,0.2)' : '#4ADE80',
                    animationDelay: `${1100 + i * 30}ms`,
                  }}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${((i + 1) / 5) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-3 text-[9px] sm:text-[10px] font-[450] leading-[10px] text-white/80">
            {['10:00', '12:00', '14:00', '16:00', '16:00'].map((time, i) => (
              <span key={i} style={{ opacity: i >= 3 ? 0.4 : 1 }}>
                {time}
              </span>
            ))}
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
                  <button onClick={() => navigate('/construction-site')} className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#15803D] rounded-[12px] text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90">
                    Register Site
                  </button>
                  <button onClick={() => navigate('/member-request')} className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-[#15803D] bg-[#15803D]/10 text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:bg-[#15803D]/20">
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

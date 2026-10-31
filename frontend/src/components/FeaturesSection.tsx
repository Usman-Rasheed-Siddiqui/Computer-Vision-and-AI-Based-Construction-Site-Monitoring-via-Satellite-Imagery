import { useEffect, useState, useRef } from 'react';

const features = [
  {
    id: 'f1',
    title: "Satellite-Powered Detection",
    description: "Drift strips away the noise by automatically retrieving suitable Sentinel-2 imagery through Google Earth Engine and comparing dates to detect physical changes. Every surface is made to be soft and quiet.",
    video: "https://www.pexels.com/download/video/34707892/"
  },
  {
    id: 'f2',
    title: "AI-Generated Insights",
    description: "Beginning your day should feel natural. The system analyzes detected changes to identify patterns in site development over time, generating readable AI-based observations.",
    video: "https://www.pexels.com/download/video/31699019/"
  },
  {
    id: 'f3',
    title: "Comprehensive Reporting",
    description: "No interruptions, no clutter. Generate a PDF construction monitoring report encompassing relevant satellite images, change detection results, and monitoring measurements.",
    video: "https://www.pexels.com/download/video/5417651/"
  }
];

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(features[0].id);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, { threshold: 0.6 });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setRevealed(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, { threshold: 0.15 });

    cardRefs.current.forEach(card => {
      if (card) {
        activeObserver.observe(card);
        revealObserver.observe(card);
      }
    });

    return () => {
      activeObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  const scrollToFeature = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="relative px-5 md:px-10 lg:px-16 py-20 md:py-40 lg:py-48">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 -z-10 bg-black">
        <img 
          src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260709_082449_46df5cc4-ad98-4541-9236-a2659c1478a4.png&w=1920&q=85" 
          alt="Abstract landscape"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr] gap-24 xl:gap-48">
        
        {/* Left Column - Sticky on Desktop */}
        <div className="lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-between lg:py-32">
          <div>
            <h2 className="text-white text-2xl sm:text-3xl lg:text-[46px] leading-[1.2] font-normal">
              Software that flows with your mind, not over it
            </h2>
            
            <div className="hidden lg:flex flex-col gap-3 mt-12">
              {features.map((feature) => (
                <button
                  key={`nav-${feature.id}`}
                  onClick={() => scrollToFeature(feature.id)}
                  className={`text-left px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeId === feature.id 
                      ? 'bg-black/20 text-white' 
                      : 'bg-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  {feature.title}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block bg-black/25 backdrop-blur-md rounded-2xl p-6 mt-12">
            <p className="text-white text-sm font-medium mb-4">
              No physical sensors. No complicated systems. Just your site, automatically sorted.
            </p>
            <button className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors w-full">
              Start for free
            </button>
          </div>
        </div>

        {/* Right Column - Scrolling Cards */}
        <div className="flex flex-col gap-32">
          {features.map((feature, index) => {
            const isRevealed = revealed[feature.id];
            
            return (
              <div 
                key={feature.id}
                id={feature.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`bg-black/20 backdrop-blur-sm rounded-3xl p-6 md:p-10 transition-all duration-700 ease-out transform ${
                  isRevealed ? 'translate-x-0 opacity-100' : 'translate-x-16 opacity-0'
                }`}
              >
                <svg className="mb-8" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" fill="none">
                  <path d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z" fill="rgba(255,255,255,0.8)" />
                </svg>
                
                <h3 className="text-white text-xl md:text-2xl font-medium mb-6">
                  {feature.title}
                </h3>
                
                <video 
                  className="w-full aspect-video rounded-2xl overflow-hidden bg-black/30 object-cover mb-6"
                  autoPlay muted loop playsInline
                  src={feature.video}
                />
                
                <p className="text-white/60 font-medium text-sm md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
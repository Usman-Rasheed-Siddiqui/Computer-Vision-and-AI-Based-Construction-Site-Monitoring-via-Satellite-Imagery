import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LazyVideo from './LazyVideo';

const features = [
  {
    id: 'f1',
    title: "Satellite-Powered Detection",
    description: "Drift strips away the noise by automatically retrieving suitable Sentinel-2 imagery through Google Earth Engine and comparing dates to detect physical changes. Every surface is made to be soft and quiet.",
    video: "https://videos.pexels.com/video-files/34707892/14711292_3840_2160_30fps.mp4",
    poster: "https://images.pexels.com/videos/34707892/pexels-photo-34707892.jpeg?auto=compress&cs=tinysrgb&w=1280"
  },
  {
    id: 'f2',
    title: "AI-Generated Insights",
    description: "Beginning your day should feel natural. The system analyzes detected changes to identify patterns in site development over time, generating readable AI-based observations.",
    video: "https://videos.pexels.com/video-files/31699019/13506132_1920_1080_30fps.mp4",
    poster: "https://images.pexels.com/videos/31699019/pexels-photo-31699019.jpeg?auto=compress&cs=tinysrgb&w=1280"
  },
  {
    id: 'f3',
    title: "Comprehensive Reporting",
    description: "No interruptions, no clutter. Generate a PDF construction monitoring report encompassing relevant satellite images, change detection results, and monitoring measurements.",
    video: "https://videos.pexels.com/video-files/5417651/5417651-hd_1280_720_24fps.mp4",
    poster: "https://images.pexels.com/videos/5417651/pexels-photo-5417651.jpeg?auto=compress&cs=tinysrgb&w=1280"
  }
];

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(features[0].id);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

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
            <button
            onClick={() => navigate('/signin')} 
            className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors w-full">
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
                <img src="/logo.png" alt="Sightline logo" className="mb-8 h-12 w-12 object-contain scale-125" />
                
                <h3 className="text-white text-xl md:text-2xl font-medium mb-6">
                  {feature.title}
                </h3>
                
                <LazyVideo
                  className="w-full aspect-video rounded-2xl overflow-hidden bg-black/30 object-cover mb-6"
                  src={feature.video}
                  poster={feature.poster}
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
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

// Standardized inline SVGs to replace lucide-react brand icons
const SocialIcons = {
  Facebook: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  ),
  Twitter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
  ),
  Instagram: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  ),
  Linkedin: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
  )
};

export default function FooterParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const yTruck = useTransform(scrollYProgress, [0, 1], [-50, 150]);

  return (
    <div className="bg-[#f8f9fa] w-full font-sans">

      <section 
        ref={containerRef} 
        className="relative h-screen w-full overflow-hidden"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://www.pexels.com/download/video/30810332/"
        />

        <div className="absolute top-0 w-full pt-12 md:pt-24 lg:pt-12 px-4 z-30">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl md:rounded-3xl overflow-hidden"
          >
            <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between gap-12">
              
              <div className="flex items-center gap-4">
                <div className="bg-transparent w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Construction Monitoring Logo"
                    className="w-full h-full scale-125 object-contain"
                  />
                </div>
                <span className="text-gray-900 text-2xl md:text-3xl font-bold tracking-tighter">
                  SIGHTLINE
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-10 md:gap-16">
                <div className="flex flex-col gap-4">
                  <h4 className="uppercase tracking-widest text-sm font-bold text-gray-900">Platform</h4>
                  <a href="#change-detection" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">Change Detection</a>
                  <a href="#ai-analysis" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">AI Insights</a>
                  <a href="#reports" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">PDF Reports</a>
                </div>
                
                <div className="flex flex-col gap-4">
                  <h4 className="uppercase tracking-widest text-sm font-bold text-gray-900">Access</h4>
                  <a href="#register" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">Site Registration</a>
                  <a href="#dashboard" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">Member Dashboard</a>
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="uppercase tracking-widest text-sm font-bold text-gray-900">Legal</h4>
                  <a href="#privacy" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">Private Data</a>
                  <a href="#consent" className="text-gray-500 font-medium hover:text-blue-600 transition-colors">User Consent</a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-white px-8 py-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 font-medium">
                © 2026 Sightline Monitoring. All Rights Reserved.
              </p>
              
              <div className="flex items-center gap-3">
                {/* Note how we reference the icons through the SocialIcons object here */}
                {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Linkedin].map((Icon, idx) => (
                  <a 
                    key={idx} 
                    href="#" 
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </section>
    </div>
  );
}
import { Mail, Plus } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className="bg-slate-900 rounded-t-[25px] relative z-10 py-20 md:py-32 px-6 border-t border-slate-800">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        <p className="text-slate-300 text-base md:text-lg text-center leading-relaxed max-w-lg">
          We craft systems that scale with your project. Designed to seamlessly track construction progress globally without replacing physical safety inspections.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button className="bg-blue-600 text-white rounded-full flex items-center pr-5 pl-1 py-1 group hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
              <Mail size={16} className="text-blue-600" />
            </span>
            <span className="uppercase tracking-wide font-medium text-xs">Say hello</span>
          </button>
          
          <button className="bg-slate-800 text-emerald-400 border border-slate-700 rounded-full flex items-center pr-5 pl-1 py-1 group hover:bg-slate-700 transition-colors">
            <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mr-3">
              <Plus size={16} className="text-white" />
            </span>
            <span className="uppercase tracking-wide font-medium text-xs text-white">Stay informed</span>
          </button>
        </div>
      </div>

      <div className="w-full flex items-center justify-center my-20">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div className="flex-1 h-[1px] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 mx-2 max-w-[200px] md:max-w-md opacity-50" />
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-start">
        <div className="flex flex-col gap-4">
          <img src="/logo.png" alt="Sightline logo" className="h-12 w-12 object-contain scale-125" />
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
            Global /<br/>Precision
          </span>
        </div>
        
        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] leading-[1.3] font-normal text-white flex-1">
          We build tools that provide unparalleled visibility into your construction projects. Utilizing Google Earth Engine and Sentinel-2 satellite imagery, we generate precise change masks and calculate estimated changed areas—carrying the analytical weight so you can focus on what counts.
        </p>
      </div>
    </section>
  );
}
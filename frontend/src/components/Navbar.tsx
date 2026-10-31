import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-md rounded-full shadow-2xl px-6 py-3 flex items-center justify-between gap-12 w-max">
        <span className="text-lg font-bold tracking-tight text-white">Sightline.</span>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-6 h-6 flex items-center justify-center text-white"
          aria-label="Toggle menu"
        >
          <div className="relative w-5 h-4">
            <span className={`absolute h-0.5 w-full bg-emerald-400 rounded-full transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${isOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute h-0.5 w-full bg-blue-400 rounded-full transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${isOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </div>
        </button>
      </div>

      <div className={`mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[200px] transition-all duration-300 ease-out origin-top ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}`}>
        <a href="#features" className="text-slate-300 hover:text-emerald-400 font-medium text-sm px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors">Features</a>
        <a href="#ai" className="text-slate-300 hover:text-blue-400 font-medium text-sm px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors">Vision AI</a>
        <a href="#faq" className="text-slate-300 hover:text-white font-medium text-sm px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors">FAQ</a>
      </div>
    </div>
  );
}
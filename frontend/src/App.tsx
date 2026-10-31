import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AboutSection from './components/AboutSection';
import FeaturesSection from './components/FeaturesSection';
import FooterParallax from './components/FooterParallax';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="relative w-full text-white bg-black">
      <section className="relative h-screen overflow-hidden mb-[-25px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://www.pexels.com/download/video/30811367/"
        />
        <div className="absolute inset-0 bg-slate-950/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-900" />

        <Navbar />

        <div className="relative z-10 flex flex-col justify-end h-full pb-12 md:pb-16 px-6">
          <div className="text-center w-full max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-normal leading-[1.1] tracking-tight text-white">
              Monitor your site <br />
              without <em className="not-italic text-blue-400" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>the guesswork</em>
            </h1>
            
            <p className="mx-auto mt-6 text-slate-300 text-sm md:text-base font-medium max-w-[480px]">
              Computer Vision and AI-Based Construction Site Monitoring via Satellite Imagery. A clear, automated path for builders, owners, and site supervisors.
            </p>

            <div className="mt-10 flex justify-center">
              <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-xl flex flex-row items-center pl-6 pr-1 py-1 gap-6">
                <span className="text-slate-200 text-sm font-medium hidden md:block">
                  No physical sensors required. Just satellite data, clearly tracked.
                </span>
                <span className="text-slate-200 text-sm font-medium md:hidden">
                  Satellite progress, tracked.
                </span>
                <button 
                  onClick={() => navigate('/signin')}
                  className="bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Start for free
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <FeaturesSection />
      <FooterParallax />
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MagicBentoGrid, { type BentoItem } from '../components/common/MagicBentoGrid';

export const LandingPage: React.FC = () => {
  const portalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Canvas Portal Parallax Rendering
  useEffect(() => {
    const canvas = portalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tiltX = 0;
    let tiltY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 20;
      targetY = -y * 20;
    };

    window.addEventListener('mousemove', handlePointerMove);

    const render = () => {
      tiltX += (targetX - tiltX) * 0.08;
      tiltY += (targetY - tiltY) * 0.08;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw starry celestial orbit grid in background
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Radial glowing background
      const radGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w / 2);
      radGrad.addColorStop(0, 'rgba(30, 58, 138, 0.45)');
      radGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
      radGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // Orbit tracks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.38, h * 0.22, (tiltX * Math.PI) / 180, 0, Math.PI * 2);
      ctx.stroke();

      // Inner satellite telemetry ring
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.26, h * 0.15, (-tiltY * Math.PI) / 180, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting beacon satellite point
      const time = Date.now() * 0.001;
      const satX = Math.cos(time) * (w * 0.38);
      const satY = Math.sin(time) * (h * 0.22);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Center Site Pin
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(tiltX * 1.5, tiltY * 1.5, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const bentoItems: BentoItem[] = [
    {
      id: 1,
      label: 'Precision Telemetry',
      title: 'Automated Satellite Sync',
      description:
        'Continuous orbital captures over coordinate extents (1–1000m) with high-res multi-spectral alignment.',
      icon: <Satellite className="w-5 h-5" />,
      colSpan: 1,
    },
    {
      id: 2,
      label: 'Deep Learning',
      title: 'AI Change Mask Detection',
      description:
        'Bi-temporal neural networks compare baseline and current imagery to detect structural additions and earthworks.',
      icon: <Layers className="w-5 h-5" />,
      colSpan: 2,
    },
    {
      id: 3,
      label: 'Audit & Governance',
      title: 'RBAC Site Access Requests',
      description:
        'Site owners receive and approve collaborator access requests with fine-grained database isolation.',
      icon: <ShieldCheck className="w-5 h-5" />,
      colSpan: 1,
    },
    {
      id: 4,
      label: 'Analytics',
      title: 'Quantified Area & Progress Metrics',
      description:
        'Calculates real square meters changed and milestone completion percentages directly from progress logs.',
      icon: <TrendingUp className="w-5 h-5" />,
      colSpan: 1,
    },
    {
      id: 5,
      label: 'Verification',
      title: 'Auditable Progress Logs',
      description:
        'Every satellite scan generates timestamped baseline, latest image, and change mask verification records.',
      icon: <Activity className="w-5 h-5" />,
      colSpan: 1,
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Define Site Coordinates',
      desc: 'Enter latitude, longitude, and bounding monitoring extent (1–1000m) with site details.',
    },
    {
      step: '02',
      title: 'Satellite Capture & Ingestion',
      desc: 'High-resolution multi-temporal satellite imagery is ingested and georeferenced for the target extent.',
    },
    {
      step: '03',
      title: 'AI Computer Vision Change Detection',
      desc: 'Deep learning models compare the baseline image with latest captures to generate a binary change mask.',
    },
    {
      step: '04',
      title: 'Track Milestone Progress',
      desc: 'Review exact square meters changed, percentage advancement, and progress verification history.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 border-b border-slate-900">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Next-Gen Earth Observation AI</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Monitor Construction Sites from Orbit with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                  Satellite AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Autonomous satellite monitoring, multi-temporal change detection, and quantified progress verification. Connect securely to your sites and monitor structural evolution from space.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 transition-all group"
                >
                  <span>Launch Monitoring Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition-colors"
                >
                  <span>Engineer Sign In</span>
                </Link>
              </div>

              {/* Telemetry Stat Pills */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-900/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <span className="text-2xl font-bold text-white block">1-1000m</span>
                  <span className="text-xs text-slate-400">Monitoring Extent</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-cyan-400 block">AI Mask</span>
                  <span className="text-xs text-slate-400">Change Detection</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-emerald-400 block">100%</span>
                  <span className="text-xs text-slate-400">Verified Database</span>
                </div>
              </div>
            </div>

            {/* Right: 3D Interactive Satellite Portal Canvas */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-3xl border border-blue-500/30 bg-gradient-to-b from-slate-900/80 to-slate-950 p-2 shadow-2xl shadow-blue-500/10">
                {/* Canvas viewport */}
                <canvas
                  ref={portalCanvasRef}
                  width={400}
                  height={400}
                  className="w-full h-full rounded-[22px] block cursor-crosshair"
                />

                {/* Overlaid Telemetry Badge */}
                <div className="absolute bottom-5 left-5 right-5 p-3 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-slate-300">GEO-ORBIT LOCK</span>
                  </div>
                  <span className="text-blue-400 font-mono text-[11px]">24.86° N, 67.00° E</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Civil Verification & AI Aerial Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            A unified stack connecting satellite earth observation to real-time project management.
          </p>
        </div>

        <MagicBentoGrid items={bentoItems} columns={3} />
      </section>

      {/* How Satellite Monitoring Works */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-mono">
              Operational Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Satellite Pass to Verified Progress
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              The end-to-end lifecycle of automated satellite imagery ingestion and computer vision processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.step}
                className="relative p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-3">
                  <span className="text-2xl font-mono font-bold text-blue-400/80 block">
                    {step.step}
                  </span>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(idx + 1) * 25}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Begin Satellite Monitoring for Your Sites?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Log in to your authenticated workspace or sign up to create and request construction site monitoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all"
            >
              Create Account
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;

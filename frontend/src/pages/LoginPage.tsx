import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Satellite,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Radio,
  Globe2,
} from 'lucide-react';
import { login } from '../api/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ username: username.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        'Authentication failed. Please verify your username and password.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur z-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Satellite className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            OrbitWatch <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">AI</span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Return to home &rarr;
        </Link>
      </header>

      {/* Main Split-Screen Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 items-center gap-8">
        {/* Left Side: Space / Telemetry Visual Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-[600px] rounded-3xl p-8 relative overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950/90 shadow-2xl">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.25) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Radial light glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Upper Telemetry Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ORBITAL MONITORING STATION</span>
            </div>
            <span className="text-xs font-mono text-slate-500">v2.4.0-PROD</span>
          </div>

          {/* Middle Graphic / Orbital Telemetry Details */}
          <div className="relative z-10 my-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-600/10">
              <Globe2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Mission Control & AI Change Detection
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Continuous high-resolution satellite passes deliver computer-vision insights on structural earthwork, excavation boundaries, and volumetric progress.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Revisit Frequency
                </div>
                <div className="text-base font-semibold text-white font-mono">
                  Every 72 Hours
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Computer Vision
                </div>
                <div className="text-base font-semibold text-emerald-400 font-mono">
                  Mask R-CNN & ResNet
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Authorized civil engineering personnel & satellite telematics access only.</span>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-md bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Secure Console Access</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Log in to OrbitWatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access construction telemetry and site analytics.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. lead_engineer"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating with JWT...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Mission Control</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Don't have an engineering account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  Request Registration
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimal info */}
      <footer className="w-full px-6 py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-400">
        Django REST SimpleJWT Auth &bull; Connected to PostgreSQL &bull; OrbitWatch AI
      </footer>
    </div>
  );
};

export default LoginPage;

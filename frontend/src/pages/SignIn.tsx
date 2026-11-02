import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await login({ username, password });
      window.location.href = '/hero'; // Redirect after successful login
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* Brand Panel (Left) */}
      <aside className="hidden lg:flex relative flex-col justify-between w-[41%] min-h-screen p-8 lg:p-12 overflow-hidden bg-[#0b0a1f] text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none" style={{ backgroundImage: `url(https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/d889cba6-535c-450f-9b74-7270c0e01e9a.webp)` }} />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white grid place-item shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mx-auto my-auto text-gray-900"><circle cx="12" cy="9.5" r="5" stroke="currentColor" strokeWidth="2.6"/><rect x="10.7" y="13" width="2.6" height="8" rx="1.3" fill="currentColor"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">keylight.</span>
        </div>

        <div className="relative z-10 my-auto max-w-sm">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight text-gray-100">Unlock calmly. Grow without worry.</h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">Sign in with precision, not a guess. Made to keep every development team in absolute flow.</p>
          
          {/* Testimonial Quote */}
          <div className="mt-8 p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
            <p className="text-xs text-white/80 leading-relaxed">"Our workflow security across Karachi and Lahore offices became rock solid instantly. No more lost key issues."</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Hamza Khan</p>
                <p className="text-[10px] text-white/40">Co-founder, Karachi Tech</p>
              </div>
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-[10px] font-bold">HK</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          漏 2026 Keylight, Inc. All rights reserved.
        </div>
      </aside>

      {/* Auth Form Panel (Right) */}
      <main className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-24 bg-white">
        <div className="flex justify-end lg:justify-start">
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            ← Back to home
          </button>
        </div>
        <div className="flex justify-end lg:hidden">
          <span className="font-bold text-lg tracking-tight">keylight.</span>
        </div>

        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-3xl font-semibold tracking-tight">Hello again!</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to carry on.</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">Username or Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username" 
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="w-full h-10 pl-9 pr-10 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-black focus:ring-black" />
                <span className="text-gray-600">Remember me</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            No Keylight space yet? <a href="/signup" className="font-semibold text-gray-900 hover:underline">Open a free space</a>
          </p>
        </div>

        <div className="flex justify-center gap-6 text-xs text-gray-400 pt-8">
          <a href="#" className="hover:text-gray-600">Terms</a>
          <a href="#" className="hover:text-gray-600">Privacy</a>
          <a href="#" className="hover:text-gray-600">Support</a>
        </div>
      </main>
    </div>
  );
}
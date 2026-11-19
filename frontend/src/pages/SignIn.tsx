import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { SESSION_EXPIRED_FLAG } from '../api/session';
import AuthBrandPanel from '../components/AuthBrandPanel';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() =>
    sessionStorage.getItem(SESSION_EXPIRED_FLAG)
      ? 'Your session ended after 1 hour of inactivity. Please sign in again.'
      : '',
  );

  useEffect(() => {
    sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
  }, []);

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
      <AuthBrandPanel
        headline="Welcome back to your sites."
        text="Sign in to compare satellite images, review detected changes and track construction progress."
        cardTitle="What's waiting for you"
        items={['Your registered and shared construction sites','Change detection between any two dates','AI progress summaries and PDF reports']}
      />

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
          <span className="flex items-center gap-2 font-bold text-lg tracking-tight"><img src="/logo.png" alt="" className="h-7 w-7 object-contain" />Sightline.</span>
        </div>

        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Sightline account.</p>

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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            New to Sightline? <a href="/signup" className="font-semibold text-gray-900 hover:underline">Create an account</a>
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
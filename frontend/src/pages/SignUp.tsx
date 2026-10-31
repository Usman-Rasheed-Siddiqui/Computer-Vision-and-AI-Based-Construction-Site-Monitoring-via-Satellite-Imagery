import React, { useState } from 'react';
import { register } from '../api/auth';
import { Mail, Lock} from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
        await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName
        });
      alert('Account registered successfully! Please sign in.');
      window.location.href = '/signin';
    } catch (err: any) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Registration failed.');
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
          <h2 className="text-4xl font-semibold tracking-tight leading-tight text-gray-100">Create your space. Build securely.</h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">Join teams across Pakistan tracking and managing project access with zero friction.</p>

          <div className="mt-8 p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
            <p className="text-xs text-white/80 leading-relaxed">"Exactly the right mix of strictness and ease. It let our engineering squad ship our new release weeks ahead."</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Ayesha Malik</p>
                <p className="text-[10px] text-white/40">Lead Engineer, Lahore Labs</p>
              </div>
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[10px] font-bold">AM</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          © 2026 Keylight, Inc. All rights reserved.
        </div>
      </aside>

      {/* Auth Form Panel (Right) */}
      <main className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-white">
        <div className="flex justify-end lg:hidden">
          <span className="font-bold text-lg tracking-tight">keylight.</span>
        </div>

        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
          <p className="mt-1 text-sm text-gray-500">Open your free Keylight space.</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Email address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  required 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="w-full h-10 px-3 mt-1 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 mt-1 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" 
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 mt-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have a space? <a href="/signin" className="font-semibold text-gray-900 hover:underline">Sign in</a>
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
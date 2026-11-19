import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import AuthBrandPanel from '../components/AuthBrandPanel';
import { Mail, Lock} from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
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
      const data = err.response?.data;
      const firstField = data && typeof data === 'object'
        ? (Object.values(data).flat()[0] as string | undefined)
        : undefined;
      setError(data?.detail || firstField || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* Brand Panel (Left) */}
      <AuthBrandPanel
        headline="Create your account. Monitor with confidence."
        text="Register your construction sites and track physical progress from satellite imagery."
        cardTitle="How it works"
        items={['Register a site and confirm it on the map','Compare satellite images from two dates','Read the AI summary and download the report']}
      />

      {/* Auth Form Panel (Right) */}
      <main className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-white">
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
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start monitoring your construction sites.</p>

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
            Already have an account? <a href="/signin" className="font-semibold text-gray-900 hover:underline">Sign in</a>
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
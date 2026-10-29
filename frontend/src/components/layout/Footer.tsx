import React from 'react';
import { Link } from 'react-router-dom';
import { Satellite, Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Satellite className="w-4 h-4 text-blue-400" />
              <span>OrbitWatch AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Computer Vision and AI-Based Construction Site Monitoring via High-Resolution Satellite Imagery.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Django REST + Supabase PostgreSQL</span>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="hover:text-blue-400 transition-colors">
                  Telemetry Dashboard
                </Link>
              </li>
              <li>
                <Link to="/sites" className="hover:text-blue-400 transition-colors">
                  Construction Sites
                </Link>
              </li>
              <li>
                <Link to="/my-join-requests" className="hover:text-blue-400 transition-colors">
                  Site Access Requests
                </Link>
              </li>
              <li>
                <Link to="/access-requests" className="hover:text-blue-400 transition-colors">
                  Incoming Approvals
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Features */}
          <div>
            <h4 className="text-white font-semibold mb-3">Core Capabilities</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-temporal Change Detection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sentinel & High-Res Planet Telemetry</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>JWT RBAC Access Delegation</span>
              </li>
            </ul>
          </div>

          {/* Project Details */}
          <div>
            <h4 className="text-white font-semibold mb-3">Architecture</h4>
            <p className="text-slate-400 leading-relaxed">
              NED University of Engineering & Technology — Final Year Design Project. All telemetry retrieved securely through Django REST backend endpoints.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} OrbitWatch AI. Computer Vision & Satellite Imagery Monitoring.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
              API Base: 127.0.0.1:8000/api
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

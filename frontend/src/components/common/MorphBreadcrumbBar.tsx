import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  path?: string;
}

interface MorphBreadcrumbBarProps {
  items: BreadcrumbItem[];
  parentTitle?: string;
  pageTitle?: string;
  className?: string;
}

export const MorphBreadcrumbBar: React.FC<MorphBreadcrumbBarProps> = ({
  items,
  className = '',
}) => {
  return (
    <div className={`space-y-2 mb-6 ${className}`}>
      {/* Breadcrumb pill bar */}
      <nav
        aria-label="Breadcrumb navigation"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-sm text-xs font-medium"
      >
        <Link
          to="/dashboard"
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          title="Dashboard Home"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="sr-only">Home</span>
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const targetUrl = item.to || item.path;

          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-none" />
              {isLast || !targetUrl ? (
                <span className="text-white font-semibold truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={targetUrl}
                  className="text-slate-400 hover:text-slate-200 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};

export default MorphBreadcrumbBar;

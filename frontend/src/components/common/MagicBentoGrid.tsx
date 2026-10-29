import React from 'react';
import './MagicBento.css';

export interface BentoItem {
  id?: string | number;
  label?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
  content?: React.ReactNode;
  image?: string;
  colSpan?: number;
  rowSpan?: number;
  onClick?: () => void;
}

interface MagicBentoGridProps {
  items: BentoItem[];
  columns?: number;
  className?: string;
  glowColor?: string;
}

export const MagicBentoGrid: React.FC<MagicBentoGridProps> = ({
  items,
  className = '',
  glowColor = '59, 130, 246', // blue-500
}) => {
  return (
    <div
      className={`magic-bento grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}
      style={{
        '--mb-glow-rgb': glowColor,
        '--mb-radius': '20px',
      } as React.CSSProperties}
    >
      {items.map((item, idx) => {
        const colSpanClass =
          item.colSpan === 2
            ? 'md:col-span-2'
            : item.colSpan === 3
            ? 'lg:col-span-3'
            : 'col-span-1';

        return (
          <div
            key={item.id || idx}
            onClick={item.onClick}
            className={`magic-bento__card relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/10 group ${
              item.onClick ? 'cursor-pointer' : ''
            } ${colSpanClass}`}
          >
            {/* Background image if present */}
            {item.image && (
              <>
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
              </>
            )}

            {/* Glowing top rim */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

            {/* Content Header */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                {item.icon && (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    {item.icon}
                  </div>
                )}
                {item.label && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/80">
                    {item.label}
                  </span>
                )}
              </div>

              {item.visual && <div className="py-2">{item.visual}</div>}

              <div>
                <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Custom Content slot */}
            {item.content && <div className="relative z-10 mt-4">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default MagicBentoGrid;

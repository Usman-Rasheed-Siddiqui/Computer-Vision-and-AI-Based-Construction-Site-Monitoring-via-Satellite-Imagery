'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type MagicBentoVisual = 'analytics' | 'dashboard' | 'collaboration' | 'automation' | 'integration' | 'security';

export interface MagicBentoItem {
  id?: string | number;
  label?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  visual?: MagicBentoVisual | ReactNode;
  content?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  colSpan?: number;
  rowSpan?: number;
  chartData?: number[];
  chartLabels?: string[];
  chartSuffix?: string;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: 'dark' | 'light';
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  items: MagicBentoItem[];
  columns: number;
  gap: number;
  enableBorderGlow: boolean;
  enableSpotlight: boolean;
  spotlightRadius: number;
  enableStars: boolean;
  particleCount: number;
  enableTilt: boolean;
  enableMagnetism: boolean;
  clickEffect: boolean;
  intro: boolean;
  disableAnimations: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  glow: number[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  rate: number;
}

interface CardState {
  hot: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vrx: number;
  vry: number;
  vtx: number;
  vty: number;
  press: number;
  vpress: number;
  stars: number;
  particles: Particle[] | null;
  active: boolean;
  drawn?: boolean;
  written: Record<string, string>;
}

const THEMES: Record<'dark' | 'light', Record<string, string | number>> = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
    '--mb-ink': '#f4f4f5',
    '--mb-muted': 'rgba(244, 244, 245, 0.6)',
    '--mb-faint': 'rgba(244, 244, 245, 0.3)',
    '--mb-line': 'rgba(244, 244, 245, 0.1)',
    '--mb-secondary': '#a1a1aa',
    '--mb-secondary-ink': '#121016',
    '--mb-cursor-stroke': 'rgba(18, 16, 22, 0.9)',
    '--mb-ring': 'rgba(18, 16, 22, 0.85)',
    '--mb-focus': 'rgba(244, 244, 245, 0.5)',
    '--mb-glow-alpha': 0.85,
    '--mb-spot-alpha': 0.07
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
    '--mb-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow': '0 24px 48px -30px rgba(24, 24, 27, 0.28), 0 8px 18px -14px rgba(24, 24, 27, 0.16)',
    '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--mb-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.22)',
    '--mb-well': 'rgba(24, 24, 27, 0.025)',
    '--mb-well-edge': 'rgba(24, 24, 27, 0.06)',
    '--mb-ink': '#18181b',
    '--mb-muted': 'rgba(24, 24, 27, 0.6)',
    '--mb-faint': 'rgba(24, 24, 27, 0.3)',
    '--mb-line': 'rgba(24, 24, 27, 0.08)',
    '--mb-secondary': '#71717a',
    '--mb-secondary-ink': '#ffffff',
    '--mb-cursor-stroke': '#ffffff',
    '--mb-ring': '#ffffff',
    '--mb-focus': 'rgba(24, 24, 27, 0.4)',
    '--mb-glow-alpha': 0.5,
    '--mb-spot-alpha': 0.035
  }
};

const INK: Record<'dark' | 'light', number[]> = { dark: [244, 244, 245], light: [24, 24, 27] };
const MIN_CELL = 150;
const MIN_PAIR = 200;
const STAGGER = 80;
const TILT = 6;
const MAGNET = 6;

const ROOT_CLASS = 'magic-bento relative box-border grid w-full [grid-auto-flow:row_dense] text-[color:var(--mb-ink)] [-webkit-tap-highlight-color:transparent]';
const CELL_CLASS = 'magic-bento__cell relative min-h-0 min-w-0 [--mb-delay:0ms]';
const CARD_CLASS = 'magic-bento__card relative box-border isolate flex h-full w-full select-none flex-col overflow-hidden rounded-[var(--mb-radius)] text-[color:var(--mb-ink)] no-underline outline-none [background:var(--mb-surface)] [box-shadow:var(--mb-shadow)] [transform:perspective(900px)_translate3d(var(--mb-tx,0px),var(--mb-ty,0px),0)_rotateX(var(--mb-rx,0deg))_rotateY(var(--mb-ry,0deg))_scale(var(--mb-press,1))] data-[clickable]:cursor-pointer focus-visible:[box-shadow:var(--mb-shadow),0_0_0_2px_var(--mb-focus)]';
const IMAGE_CLASS = 'pointer-events-none absolute inset-0 z-0 h-full w-full object-cover';
const SCRIM_CLASS = 'pointer-events-none absolute inset-0 z-0';
const LIGHT_CLASS = 'pointer-events-none absolute inset-0 z-[1] rounded-[inherit]';
const STARS_CLASS = 'pointer-events-none absolute inset-0 z-[1] block h-full w-full';
const RIM_CLASS = 'pointer-events-none absolute inset-0 z-[3] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--mb-edge),inset_0_1px_0_var(--mb-highlight)]';
const BORDER_CLASS = 'pointer-events-none absolute inset-0 z-[4] box-border rounded-[inherit] p-px';
const CONTENT_CLASS = 'relative z-[2] box-border flex min-h-0 flex-1 flex-col gap-3 p-[var(--mb-pad)]';
const HEADER_CLASS = 'flex min-w-0 items-center gap-2 text-[12px] leading-4 font-medium text-[color:var(--mb-muted)] [[data-image]_&]:text-[rgba(244,244,245,0.72)]';
const ICON_CLASS = 'grid h-4 w-4 flex-none place-items-center text-[color:var(--mb-ink)] [[data-image]_&]:text-[#f4f4f5]';
const LABEL_CLASS = 'overflow-hidden text-ellipsis whitespace-nowrap';
const VISUAL_CLASS = 'relative flex min-h-0 flex-1 flex-col justify-center [container-type:size]';
const TEXT_CLASS = 'mt-auto flex flex-col gap-1';
const TITLE_CLASS = 'm-0 text-[15px] leading-5 font-semibold tracking-[-0.01em] text-[color:var(--mb-ink)] [[data-image]_&]:text-[#f4f4f5] [[data-autohide]_&]:line-clamp-1';
const DESCRIPTION_CLASS = 'm-0 text-[13px] leading-[1.45] text-[color:var(--mb-muted)] [[data-image]_&]:text-[rgba(244,244,245,0.72)] [[data-autohide]_&]:line-clamp-2';
const CHART_CLASS = 'magic-bento__chart flex min-h-0 flex-1 touch-pan-y flex-col';
const FIGURE_CLASS = 'flex min-w-0 items-baseline gap-1.5 whitespace-nowrap';
const FIGURE_VALUE_CLASS = 'text-[15px] leading-[18px] font-semibold tracking-[-0.02em] text-[color:var(--mb-ink)] tabular-nums';
const FIGURE_NOTE_CLASS = 'min-w-0 overflow-hidden text-ellipsis text-[11.5px] leading-[14px] text-[color:var(--mb-muted)] tabular-nums';
const PLOT_CLASS = 'relative mt-1.5 min-h-0 flex-1 [&_svg]:absolute [&_svg]:inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:overflow-visible';
const CHART_AREA_CLASS = 'magic-bento__chart-area [fill:rgba(var(--mb-accent-rgb),0.14)]';
const CHART_LINE_CLASS = 'magic-bento__chart-line fill-none [stroke:rgb(var(--mb-accent-rgb))] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]';
const SCRUB_CLASS = 'pointer-events-none absolute top-0 bottom-0 left-0 w-px opacity-0 transition-opacity duration-[180ms] [background:linear-gradient(to_bottom,rgba(var(--mb-accent-rgb),0),rgba(var(--mb-accent-rgb),0.35))] [[data-scrub]_&]:opacity-100';
const SCRUB_DOT_CLASS = 'absolute top-0 left-0 -mt-[3.5px] -ml-[3px] h-[7px] w-[7px] rounded-full [background:rgb(var(--mb-accent-rgb))] [box-shadow:0_0_0_3px_var(--mb-ring)]';
const BARS_CLASS = 'magic-bento__bars flex min-h-0 flex-1 flex-col';
const BARS_PLOT_CLASS = 'mt-2 flex min-h-0 flex-1 items-end gap-[5px]';
const BAR_CLASS = 'magic-bento__bar relative h-[calc(var(--h)*100%)] min-h-[3px] flex-1 origin-bottom rounded-[3px_3px_2px_2px] bg-[rgba(var(--mb-accent-rgb),0.18)] transition-[background-color,filter] duration-200 hover:bg-[rgba(var(--mb-accent-rgb),0.42)] data-[peak]:bg-[rgb(var(--mb-accent-rgb))] data-[peak]:hover:brightness-110';

const SCRIM_STYLE: CSSProperties = { background: 'linear-gradient(to top, rgba(10, 9, 13, 0.82) 0%, rgba(10, 9, 13, 0.7) 14%, rgba(10, 9, 13, 0.46) 30%, rgba(10, 9, 13, 0.2) 46%, rgba(10, 9, 13, 0.05) 60%, rgba(10, 9, 13, 0) 72%)' };
const FALLOFF = [1, 0.973, 0.837, 0.593, 0.317, 0.104, 0.009];
const glowStops = (alpha: string, weight: string) => `${FALLOFF.map((fall, index) => `rgba(var(--mb-glow-rgb), calc(var(${alpha}) * var(${weight}, 0) * ${fall})) ${index * 15}%`).join(', ')}, rgba(var(--mb-glow-rgb), 0) 100%`;
const LIGHT_STYLE: CSSProperties = { background: `radial-gradient(var(--mb-spot-size) circle at var(--mb-x, -999px) var(--mb-y, -999px), ${glowStops('--mb-spot-alpha', '--mb-hot')})` };
const WAVE: [string, string][] = [['0', '110px'], ['0.1', '80px'], ['0.32', '52px'], ['0.68', '28px'], ['0.94', '10px'], ['1', '3px']];
const BORDER_STYLE: CSSProperties = {
  background: `radial-gradient(var(--mb-border-size) circle at var(--mb-x, -999px) var(--mb-y, -999px), ${glowStops('--mb-glow-alpha', '--mb-near')}), radial-gradient(circle at var(--mb-wx, -999px) var(--mb-wy, -999px), ${WAVE.map(([alpha, offset]) => `rgba(var(--mb-glow-rgb), calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * ${alpha})) calc(var(--mb-wr, 0px) - ${offset})`).join(', ')}, rgba(var(--mb-glow-rgb), 0) var(--mb-wr, 0px))`,
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)'
};

const STYLE = `.magic-bento{--mb-spring:cubic-bezier(0.34, 1.4, 0.64, 1)}@supports (transition-timing-function: linear(0,1)){.magic-bento{--mb-spring: linear( 0,0.0603,0.2033,0.3821,0.5633,0.7258,0.8584,0.9574,1.0242,1.0634,1.0809,1.0828,1.0747,1.0613,1.046,1.0313,1.0186,1.0085,1.0012,0.9965,0.994,0.9931,0.9933,0.9941,0.9953,0.9966,0.9978,0.9988,1 )}}.magic-bento[data-intro] .magic-bento__cell{opacity: 0;transform: translate3d(0,16px,0) scale(0.97)}.magic-bento[data-intro] .magic-bento__cell[data-state='in']{opacity: 1;transform: none;transition: opacity 420ms cubic-bezier(0.22,1,0.36,1) var(--mb-delay),transform 760ms var(--mb-spring) var(--mb-delay)}.magic-bento[data-motion] .magic-bento__chart-line{stroke-dasharray: 1;animation: magic-bento-draw 1100ms cubic-bezier(0.65,0,0.35,1) calc(var(--mb-delay) + 220ms) both paused}.magic-bento[data-motion] .magic-bento__chart-area{animation: magic-bento-fade 700ms ease calc(var(--mb-delay) + 700ms) both paused}.magic-bento[data-motion] .magic-bento__bar{animation: magic-bento-grow 760ms var(--mb-spring) calc(var(--mb-delay) + 200ms + var(--i) * 55ms) both paused}.magic-bento[data-motion] .magic-bento__cell[data-state='in'] :is(.magic-bento__chart-line,.magic-bento__chart-area,.magic-bento__bar){animation-play-state: running}@keyframes magic-bento-draw{from{stroke-dashoffset: 1}to{stroke-dashoffset: 0}}@keyframes magic-bento-fade{from{opacity: 0}to{opacity: 1}}@keyframes magic-bento-grow{from{transform: scaleY(0)}to{transform: scaleY(1)}}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const vars = (values: Record<string, string | number>) => values as CSSProperties;

const parseRgb = (value?: string | null): number[] | null => {
  if (!value) return null;
  const text = String(value).trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
    return numbers.slice(0, 3).map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  }
  return null;
};

const inkFor = (rgb: number[]) => {
  const [r, g, b] = rgb.map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#121016' : '#ffffff';
};

const curve = (values: number[], width: number, height: number) => {
  const top = 6;
  const bottom = 2;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const points: number[][] = values.map((value, index) => [
    (index / Math.max(1, values.length - 1)) * width,
    top + (1 - (high === low ? 0 : (value - low) / (high - low))) * (height - top - bottom)
  ]);
  const count = points.length;
  if (count < 2) return { line: '', area: '', samples: points };
  
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === count - 1) return slopes[count - 2];
    return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) { tangents[i] = 0; tangents[i + 1] = 0; continue; }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }
  let line = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  const samples: number[][] = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    const c1 = [x0 + third, y0 + tangents[i] * third];
    const c2 = [x1 - third, y1 - tangents[i + 1] * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
      ]);
    }
  }
  samples.push(points[count - 1]);
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
};

const sampleAt = (samples: number[][], x: number) => {
  if (!samples.length) return 0;
  let index = 1;
  while (index < samples.length - 1 && samples[index][0] < x) index++;
  const [x0, y0] = samples[index - 1] || [0,0];
  const [x1, y1] = samples[index] || [0,0];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

const AnalyticsVisual = ({ data, labels, suffix = '' }: { data?: number[], labels?: string[], suffix?: string }) => {
  const chartData = data && data.length > 0 ? data : [0, 0];
  const chartLabels = labels && labels.length > 0 ? labels : chartData.map((_, i) => `Point ${i + 1}`);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const update = () => {
      const next = { width: plot.clientWidth, height: plot.clientHeight };
      setSize(previous => previous && previous.width === next.width && previous.height === next.height ? previous : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  const shape = useMemo(() => (size && size.width > 4 && size.height > 4 ? curve(chartData, size.width, size.height) : null), [size, chartData]);

  const scrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    const plot = plotRef.current;
    const chart = chartRef.current;
    const line = scrubRef.current;
    const dot = dotRef.current;
    const label = valueRef.current;
    const note = noteRef.current;
    if (!shape || !plot || !chart || !line || !dot || !label || !note) return;
    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = sampleAt(shape.samples, x);
    const position = (x / Math.max(1, rect.width)) * Math.max(1, chartData.length - 1);
    const index = Math.floor(position);
    const next = Math.min(chartData.length - 1, index + 1);
    const value = chartData[index] + (chartData[next] - chartData[index]) * (position - index);
    
    chart.dataset.scrub = '';
    line.style.transform = `translateX(${x.toFixed(1)}px)`;
    dot.style.transform = `translateY(${y.toFixed(1)}px)`;
    label.textContent = `${value.toFixed(1)}${suffix}`;
    note.textContent = chartLabels[index] || '';
  };

  const rest = () => {
    if (chartRef.current) delete chartRef.current.dataset.scrub;
    if (valueRef.current) valueRef.current.textContent = `${chartData[chartData.length - 1].toFixed(1)}${suffix}`;
    if (noteRef.current) noteRef.current.textContent = 'Latest';
  };

  return (
    <div ref={chartRef} className={CHART_CLASS} onPointerMove={scrub} onPointerDown={scrub} onPointerLeave={rest}>
      <div className={FIGURE_CLASS}>
        <span ref={valueRef} className={FIGURE_VALUE_CLASS}>
          {chartData[chartData.length - 1].toFixed(1)}{suffix}
        </span>
        <span ref={noteRef} className={FIGURE_NOTE_CLASS}>
          Latest
        </span>
      </div>
      <div ref={plotRef} className={PLOT_CLASS}>
        {shape && size && (
          <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <path className={CHART_AREA_CLASS} d={shape.area} />
            <path className={CHART_LINE_CLASS} d={shape.line} pathLength="1" />
          </svg>
        )}
        <span ref={scrubRef} className={SCRUB_CLASS}>
          <span ref={dotRef} className={SCRUB_DOT_CLASS} />
        </span>
      </div>
    </div>
  );
};

const DashboardVisual = ({ data, suffix = '' }: { data?: number[], suffix?: string }) => {
  const chartData = data && data.length > 0 ? data : [0, 0, 0, 0, 0];
  const maxVal = Math.max(...chartData);
  
  return (
    <div className={BARS_CLASS}>
      <div className={FIGURE_CLASS}>
        <span className={FIGURE_VALUE_CLASS}>{chartData[chartData.length - 1].toFixed(1)}{suffix}</span>
        <span className={FIGURE_NOTE_CLASS}>Latest Scan</span>
      </div>
      <div className={BARS_PLOT_CLASS}>
        {chartData.map((height, index) => (
          <span
            key={index}
            className={BAR_CLASS}
            data-peak={height === maxVal && maxVal > 0 ? '' : undefined}
            style={vars({ '--h': maxVal > 0 ? height / maxVal : 0, '--i': index })}
          />
        ))}
      </div>
    </div>
  );
};

const VISUALS: Record<string, React.FC<any>> = {
  analytics: AnalyticsVisual,
  dashboard: DashboardVisual,
};

const REPLAY = new Set([
  'magic-bento-draw', 'magic-bento-fade', 'magic-bento-grow', 'magic-bento-pop', 
  'magic-bento-select', 'magic-bento-wait', 'magic-bento-run', 'magic-bento-check', 
  'magic-bento-rail', 'magic-bento-switch-track', 'magic-bento-switch-knob'
]);

const finite = (animation: Animation) => {
  const timing = animation.effect?.getTiming?.();
  return timing ? timing.iterations !== Infinity : false;
};

const nameOf = (animation: Animation) => (animation as CSSAnimation).animationName || '';

const MagicBento = ({
  items = [],
  columns = 4,
  rowHeight = 200,
  gap = 12,
  radius = 20,
  theme = 'dark',
  glowColor,
  textAutoHide = true,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = 300,
  enableStars = false,
  particleCount = 24,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  intro = true,
  disableAnimations = false,
  onItemClick,
  className = '',
  style
}: MagicBentoProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const starRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const engineRef = useRef<{ sync: () => void } | null>(null);
  const [cols, setCols] = useState(Math.max(1, Math.round(columns)));

  const palette = theme === 'light' ? 'light' : 'dark';
  const glow = parseRgb(glowColor) ?? INK[palette];
  const settings: Settings = {
    items, columns: Math.max(1, Math.round(columns)), gap: Math.max(0, gap), 
    enableBorderGlow, enableSpotlight, spotlightRadius: Math.max(40, spotlightRadius), 
    enableStars, particleCount: clamp(Math.round(particleCount), 0, 120), 
    enableTilt, enableMagnetism, clickEffect, intro, disableAnimations, onItemClick, glow
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = !settingsRef.current.disableAnimations && !reduced;
    const playIntro = motion && settingsRef.current.intro;
    if (motion) root.dataset.motion = ''; else delete root.dataset.motion;
    if (playIntro) root.dataset.intro = ''; else delete root.dataset.intro;

    const pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
    const light = { x: -1e5, y: -1e5, near: 0, ready: false };
    const states: CardState[] = [];
    const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
    let rects: (DOMRect | null)[] = [];
    let bounds: DOMRect | null = null;
    let dirty = true;
    let raf = 0;
    let last = 0;
    let visible = true;
    let entered = !playIntro;
    let settleTimer = 0;
    let introTimer = 0;

    const stateFor = (index: number): CardState => {
      if (!states[index]) {
        states[index] = { hot: 0, rx: 0, ry: 0, tx: 0, ty: 0, vrx: 0, vry: 0, vtx: 0, vty: 0, press: 1, vpress: 0, stars: 0, particles: null, active: false, written: {} };
      }
      return states[index];
    };

    const write = (element: HTMLElement, state: CardState, name: string, value: string) => {
      if (state.written[name] === value) return;
      state.written[name] = value;
      element.style.setProperty(name, value);
    };

    const measure = () => {
      dirty = false;
      bounds = root.getBoundingClientRect();
      rects = cellRefs.current.map(cell => (cell ? cell.getBoundingClientRect() : null));
    };

    const startWave = (x: number, y: number, duration: number) => {
      if (!motion || !bounds) return;
      wave.x = x; wave.y = y; wave.t = 0; wave.duration = duration;
      wave.reach = Math.max(
          Math.hypot(x - bounds.left, y - bounds.top), Math.hypot(x - bounds.right, y - bounds.top),
          Math.hypot(x - bounds.left, y - bounds.bottom), Math.hypot(x - bounds.right, y - bounds.bottom)
        ) + 140;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (dirty) measure();
      const s = settingsRef.current;
      const cards = cardRefs.current;
      let busy = false;

      const margin = s.spotlightRadius * 0.5;
      const near = pointer.inside && bounds && pointer.x > bounds.left - margin && pointer.x < bounds.right + margin && pointer.y > bounds.top - margin && pointer.y < bounds.bottom + margin ? 1 : 0;
      if (!light.ready && near) { light.x = pointer.x; light.y = pointer.y; light.ready = true; }
      
      const follow = 1 - Math.exp(-dt / 0.05);
      light.x += (pointer.x - light.x) * follow; light.y += (pointer.y - light.y) * follow;
      const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
      light.near += (near - light.near) * fade;
      if (Math.abs(near - light.near) < 0.002) light.near = near; else busy = true;
      if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

      let waveRadius = 0, waveAlpha = 0;
      if (wave.t >= 0) {
        wave.t += dt;
        const progress = Math.min(1, wave.t / wave.duration);
        waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
        waveAlpha = Math.pow(1 - progress, 1.3);
        if (progress >= 1) { wave.t = -1; waveAlpha = 0; } else busy = true;
      }

      cards.forEach((card, index) => {
        const rect = rects[index];
        if (!card || !rect) return;
        const state = stateFor(index);
        const lx = light.x - rect.left, ly = light.y - rect.top;
        const px = pointer.x - rect.left, py = pointer.y - rect.top;
        const inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

        if (inside !== state.active) {
          state.active = inside;
          if (inside) card.dataset.active = ''; else delete card.dataset.active;
        }

        const hotTarget = inside && s.enableSpotlight ? 1 : 0;
        state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
        if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget; else busy = true;

        const pressTarget = pointer.down === index && s.clickEffect && motion ? 0.985 : 1;
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        for (let step = 0; step < steps; step++) {
          state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
          state.press += state.vpress * h;
        }
        if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
          state.press = pressTarget; state.vpress = 0;
        } else busy = true;

        write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
        write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
        write(card, state, '--mb-near', (s.enableBorderGlow ? light.near : 0).toFixed(3));
        write(card, state, '--mb-hot', state.hot.toFixed(3));
        write(card, state, '--mb-rx', `0deg`);
        write(card, state, '--mb-ry', `0deg`);
        write(card, state, '--mb-tx', `0px`);
        write(card, state, '--mb-ty', `0px`);
        write(card, state, '--mb-press', state.press.toFixed(4));
        write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
        write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
        write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
        write(card, state, '--mb-wa', waveAlpha.toFixed(3));
      });

      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => { if (raf || !visible) return; last = performance.now(); raf = requestAnimationFrame(frame); };
    const cardIndex = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return -1;
      const card = target.closest('.magic-bento__card');
      return card instanceof HTMLElement ? cardRefs.current.indexOf(card) : -1;
    };

    const onPointerMove = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.inside = true; wake(); };
    const onPointerOut = (event: PointerEvent) => { if (event.relatedTarget) return; pointer.inside = false; pointer.down = -1; wake(); };
    const onPointerDown = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.inside = true; pointer.down = cardIndex(event.target); wake(); };
    const release = () => { if (pointer.down < 0) return; pointer.down = -1; wake(); };

    const activate = (index: number, x: number, y: number) => {
      if (settingsRef.current.clickEffect) { if (dirty) measure(); startWave(x, y, 1.1); }
      wake();
    };

    const onClick = (event: MouseEvent) => {
      const index = cardIndex(event.target);
      const card = cardRefs.current[index];
      if (!card) return;
      if (event.detail === 0) {
        const rect = card.getBoundingClientRect();
        activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else activate(index, event.clientX, event.clientY);
    };

    const onScroll = () => { dirty = true; wake(); };

    const resizeObserver = new ResizeObserver(() => {
      const s = settingsRef.current; const width = root.clientWidth;
      const cell = (count: number) => (width - s.gap * (count - 1)) / count;
      const next = cell(s.columns) >= MIN_CELL ? s.columns : s.columns >= 2 && cell(2) >= MIN_PAIR ? 2 : 1;
      setCols(next); dirty = true; wake();
    });
    resizeObserver.observe(root);

    const enter = () => {
      entered = true; let order = 0;
      cellRefs.current.forEach(cell => { if (!cell) return; cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`); cell.dataset.state = 'in'; });
      if (dirty) measure();
      introTimer = window.setTimeout(() => { if (bounds) startWave(bounds.left, bounds.top, 1.7); wake(); }, 260);
      settleTimer = window.setTimeout(() => { cellRefs.current.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms')); }, order * STAGGER + 2600);
      wake();
    };

    let gate: IntersectionObserver | null = null;
    if (playIntro && typeof IntersectionObserver !== 'undefined') {
      gate = new IntersectionObserver((entries, observer) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect(); enter();
      }, { threshold: 0.15 });
      gate.observe(root);
    } else {
      cellRefs.current.forEach(cell => { if (cell) { cell.style.setProperty('--mb-delay', '0ms'); cell.dataset.state = 'in'; }});
    }

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { dirty = true; wake(); }
    });
    visibility.observe(root);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    root.addEventListener('click', onClick);

    engineRef.current = {
      sync: () => {
        cellRefs.current.forEach(cell => {
          if (!cell || (!entered && playIntro)) return;
          if (cell.dataset.state !== 'in') { cell.style.setProperty('--mb-delay', '0ms'); cell.dataset.state = 'in'; }
        });
        dirty = true; wake();
      }
    };

    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(settleTimer); window.clearTimeout(introTimer);
      gate?.disconnect(); visibility.disconnect(); resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScroll, { capture: true }); window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerout', onPointerOut); root.removeEventListener('click', onClick);
      engineRef.current = null;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    engineRef.current?.sync();
  }, [items, cols, rowHeight, gap, radius, enableStars, enableSpotlight, enableBorderGlow]);

  const ink = INK[palette];
  const accent = parseRgb(glowColor) ?? ink;
  const corner = Math.max(0, radius);
  const span = Math.max(1, cols);

  cellRefs.current.length = items.length;
  cardRefs.current.length = items.length;
  starRefs.current.length = items.length;

  return (
    <div
      ref={rootRef}
      className={`${ROOT_CLASS} ${className}`.trim()}
      data-autohide={textAutoHide ? '' : undefined}
      data-motion={disableAnimations ? undefined : ''}
      data-intro={intro && !disableAnimations ? '' : undefined}
      style={{
        ...vars({
          ...THEMES[palette],
          '--mb-glow-rgb': glow.join(', '),
          '--mb-accent-rgb': accent.join(', '),
          '--mb-accent-ink': inkFor(accent),
          '--mb-radius': `${corner}px`,
          '--mb-inner-radius': `${Math.round(clamp(corner * 0.5, 6, 12))}px`,
          '--mb-pad': `${Math.round(clamp(corner * 0.85, 14, 20))}px`,
          '--mb-spot-size': `${Math.max(40, spotlightRadius)}px`,
          '--mb-border-size': `${Math.round(Math.max(40, spotlightRadius) * 0.75)}px`
        }),
        gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
        gridAutoRows: span === 1 ? `minmax(${rowHeight}px, auto)` : `${rowHeight}px`,
        gap: `${Math.max(0, gap)}px`,
        ...style
      }}
    >
      <style>{STYLE}</style>
      {items.map((item, index) => {
        const entry: MagicBentoItem = item ?? {};
        const Visual = typeof entry.visual === 'string' ? VISUALS[entry.visual] : null;
        const visual = Visual ? <Visual data={entry.chartData} labels={entry.chartLabels} suffix={entry.chartSuffix} /> : typeof entry.visual === 'string' ? null : entry.visual;
        const clickable = Boolean(entry.href || entry.onClick || onItemClick);
        const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
          entry.onClick?.(event);
          onItemClick?.(entry, index);
        };
        const cardProps = {
          ref: (element: HTMLElement | null) => { cardRefs.current[index] = element; },
          className: CARD_CLASS,
          'data-clickable': clickable ? '' : undefined,
          'data-image': entry.image ? '' : undefined,
          onClick: clickable ? handleClick : undefined
        };
        const body = (
          <>
            {entry.image && <img className={IMAGE_CLASS} src={entry.image} alt="" draggable={false} />}
            {entry.image && <span className={SCRIM_CLASS} style={SCRIM_STYLE} />}
            {enableSpotlight && <span className={LIGHT_CLASS} style={LIGHT_STYLE} />}
            <div className={CONTENT_CLASS}>
              {entry.content ?? (
                <>
                  {(entry.icon || entry.label) && (
                    <div className={HEADER_CLASS}>
                      {entry.icon && <span className={ICON_CLASS}>{entry.icon}</span>}
                      {entry.label && <span className={LABEL_CLASS}>{entry.label}</span>}
                    </div>
                  )}
                  {visual && <div className={VISUAL_CLASS} aria-hidden="true">{visual}</div>}
                  {(entry.title || entry.description) && (
                    <div className={TEXT_CLASS}>
                      {entry.title && <h3 className={TITLE_CLASS}>{entry.title}</h3>}
                      {entry.description && <p className={DESCRIPTION_CLASS}>{entry.description}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
            <span className={RIM_CLASS} />
            <span className={BORDER_CLASS} style={BORDER_STYLE} />
          </>
        );

        return (
          <div
            key={entry.id ?? index}
            ref={element => { cellRefs.current[index] = element; }}
            className={CELL_CLASS}
            style={{
              gridColumn: `span ${Math.min(span, Math.max(1, Math.round(entry.colSpan ?? 1)))}`,
              gridRow: `span ${Math.max(1, Math.round(entry.rowSpan ?? 1))}`
            }}
          >
            {entry.href ? (
              <a {...cardProps} href={entry.href} target={entry.target} rel={entry.rel}>{body}</a>
            ) : (
              <div {...cardProps} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} aria-label={clickable ? entry.title : undefined}>
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MagicBento;
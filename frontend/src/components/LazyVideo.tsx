import { useEffect, useRef, useState } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
  /** How far outside the viewport to start loading (CSS margin). */
  rootMargin?: string;
}

/**
 * Muted, looping background video that only starts downloading once it is
 * close to the viewport, so videos further down the page don't compete with
 * the hero video for bandwidth on first load.
 */
export default function LazyVideo({
  src,
  className,
  poster,
  rootMargin = '300px',
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  // Without IntersectionObserver (very old browsers) just load straight away.
  const [near, setNear] = useState(() => !('IntersectionObserver' in window));

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      src={near ? src : undefined}
      preload={near ? 'auto' : 'none'}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

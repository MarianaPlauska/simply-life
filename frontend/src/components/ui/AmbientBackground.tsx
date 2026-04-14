import { useEffect, useState } from 'react';

export interface GradientZone {
  start: number;
  primary: string;
  secondary: string;
  accent: string;
}

const DEFAULT_ZONES: GradientZone[] = [
  { start: 0,    primary: 'rgba(109,40,217,0.14)', secondary: 'rgba(79,70,229,0.10)', accent: 'rgba(34,211,238,0.06)' },
  { start: 600,  primary: 'rgba(16,185,129,0.12)', secondary: 'rgba(20,184,166,0.10)', accent: 'rgba(52,211,153,0.06)' },
  { start: 1200, primary: 'rgba(6,182,212,0.14)',  secondary: 'rgba(59,130,246,0.10)', accent: 'rgba(139,92,246,0.06)' },
  { start: 1800, primary: 'rgba(59,130,246,0.12)', secondary: 'rgba(99,102,241,0.10)', accent: 'rgba(244,63,94,0.05)' },
];

function lerpColor(a: string, b: string, t: number): string {
  const parseRgba = (s: string) => {
    const m = s.match(/[\d.]+/g);
    return m ? m.map(Number) : [0, 0, 0, 0];
  };
  const ca = parseRgba(a);
  const cb = parseRgba(b);
  const mix = ca.map((v, i) => v + (cb[i] - v) * t);
  return `rgba(${Math.round(mix[0])},${Math.round(mix[1])},${Math.round(mix[2])},${mix[3].toFixed(3)})`;
}

export function AmbientBackground({
  zones = DEFAULT_ZONES,
  scrollContainerRef,
}: {
  zones?: GradientZone[];
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}) {
  const [colors, setColors] = useState({
    primary: zones[0].primary,
    secondary: zones[0].secondary,
    accent: zones[0].accent,
  });

  useEffect(() => {
    let ticking = false;
    const getScrollY = () =>
      scrollContainerRef?.current ? scrollContainerRef.current.scrollTop : window.scrollY;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getScrollY();
        let idx = 0;
        for (let i = zones.length - 1; i >= 0; i--) {
          if (y >= zones[i].start) { idx = i; break; }
        }
        const curr = zones[idx];
        const next = zones[Math.min(idx + 1, zones.length - 1)];
        const range = next.start - curr.start || 1;
        const t = Math.min(Math.max((y - curr.start) / range, 0), 1);
        setColors({
          primary:   lerpColor(curr.primary,   next.primary,   t),
          secondary: lerpColor(curr.secondary, next.secondary, t),
          accent:    lerpColor(curr.accent,    next.accent,    t),
        });
        ticking = false;
      });
    };

    const target = scrollContainerRef?.current ?? window;
    target.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);
    onScroll();
    return () => target.removeEventListener('scroll', onScroll);
  }, [zones, scrollContainerRef]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-700">
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] transition-[background-color] duration-1000"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-[background-color] duration-1000"
        style={{ backgroundColor: colors.secondary }}
      />
      <div
        className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full blur-[120px] transition-[background-color] duration-1000"
        style={{ backgroundColor: colors.accent }}
      />
      <div
        className="absolute top-[60%] left-[20%] w-[350px] h-[350px] rounded-full blur-[100px] transition-[background-color] duration-1000"
        style={{ backgroundColor: colors.secondary }}
      />
    </div>
  );
}

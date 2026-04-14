import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

/* ── Animation presets ───────────────────────────────────────── */
export const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: 'easeOut' as const },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/* ── Glass Card wrapper ──────────────────────────────────────── */
export function GlassCard({
  children,
  className = '',
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <motion.div
      variants={staggerChild}
      className={`relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:border-violet-500/20 ${noPadding ? '' : 'p-8'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── Skeleton Loader ─────────────────────────────────────────── */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[1.5rem] bg-zinc-800/40 ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 space-y-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 !rounded-xl" />
        <Skeleton className="h-4 w-24 !rounded-lg" />
      </div>
      <Skeleton className="h-10 w-24 !rounded-lg" />
      <Skeleton className="h-2 w-full !rounded-full" />
    </div>
  );
}

/* ── Animated Progress Bar ───────────────────────────────────── */
export function ProgressBar({
  pct,
  label = 'Progresso',
  color,
}: {
  pct: number;
  label?: string;
  color: string;
}) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="mt-6">
      <div className="flex justify-between text-xs text-zinc-500 font-medium mb-2">
        <span>{label}</span>
        <span className="tabular-nums">{clampedPct}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 relative">
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${clampedPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ── Circular Progress (SVG) ─────────────────────────────────── */
export function CircularProgress({
  pct,
  size = 80,
  strokeWidth = 6,
  color = 'stroke-violet-500',
  trackColor = 'stroke-zinc-800/60',
  children,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(pct, 0), 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference - (clampedPct / 100) * circumference }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Ambient Background (Scroll-Reactive Gradient) ───────────── */
/*  Each section of the dashboard has a color "zone". As the user
    scrolls, the ambient orbs cross-fade between palettes, creating
    the degradé effect shown in the HealthVibe reference.          */

export interface GradientZone {
  /** Scroll offset (px) where this zone starts dominating */
  start: number;
  /** CSS colour for the primary orb (top-left) */
  primary: string;
  /** CSS colour for the secondary orb (bottom-right) */
  secondary: string;
  /** CSS colour for the accent orb (center-right) */
  accent: string;
}

const DEFAULT_ZONES: GradientZone[] = [
  // Hero / KPIs — violet + indigo
  { start: 0,    primary: 'rgba(109,40,217,0.14)', secondary: 'rgba(79,70,229,0.10)', accent: 'rgba(34,211,238,0.06)' },
  // Health section — emerald + teal
  { start: 600,  primary: 'rgba(16,185,129,0.12)', secondary: 'rgba(20,184,166,0.10)', accent: 'rgba(52,211,153,0.06)' },
  // Keywords / Radar — cyan + blue
  { start: 1200, primary: 'rgba(6,182,212,0.14)',  secondary: 'rgba(59,130,246,0.10)', accent: 'rgba(139,92,246,0.06)' },
  // Calendar / bottom — blue + indigo
  { start: 1800, primary: 'rgba(59,130,246,0.12)', secondary: 'rgba(99,102,241,0.10)', accent: 'rgba(244,63,94,0.05)' },
];

function lerpColor(a: string, b: string, t: number): string {
  // Parse rgba strings  →  interpolate  →  return rgba
  const parseRgba = (s: string) => {
    const m = s.match(/[\d.]+/g);
    return m ? m.map(Number) : [0, 0, 0, 0];
  };
  const ca = parseRgba(a);
  const cb = parseRgba(b);
  const mix = ca.map((v, i) => v + (cb[i] - v) * t);
  return `rgba(${Math.round(mix[0])},${Math.round(mix[1])},${Math.round(mix[2])},${mix[3].toFixed(3)})`;
}

export function AmbientBackground({ zones = DEFAULT_ZONES }: { zones?: GradientZone[] }) {
  const [colors, setColors] = useState({
    primary: zones[0].primary,
    secondary: zones[0].secondary,
    accent: zones[0].accent,
  });

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Find current zone pair
        let idx = 0;
        for (let i = zones.length - 1; i >= 0; i--) {
          if (y >= zones[i].start) { idx = i; break; }
        }
        const curr = zones[idx];
        const next = zones[Math.min(idx + 1, zones.length - 1)];
        const range = next.start - curr.start || 1;
        const t = Math.min(Math.max((y - curr.start) / range, 0), 1);

        setColors({
          primary: lerpColor(curr.primary, next.primary, t),
          secondary: lerpColor(curr.secondary, next.secondary, t),
          accent: lerpColor(curr.accent, next.accent, t),
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial
    return () => window.removeEventListener('scroll', onScroll);
  }, [zones]);

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

/* ── Status Row ──────────────────────────────────────────────── */
export function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {ok ? (
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        ) : (
          <div className="w-3 h-3 rounded-full border border-zinc-700" />
        )}
        <span className={`text-[11px] ${ok ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</span>
      </div>
      <span className={`text-[10px] tabular-nums ${ok ? 'text-emerald-400' : 'text-zinc-600'}`}>{detail}</span>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
export function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

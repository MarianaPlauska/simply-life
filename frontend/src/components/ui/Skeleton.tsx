import { motion } from 'framer-motion';

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

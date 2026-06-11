import { motion } from 'framer-motion';
import { AXEL_ANALYTICS_CARD, AXEL_PROGRESS_THICK, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-sl bg-chrome ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className={`${AXEL_ANALYTICS_CARD} space-y-4`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-2 w-full" />
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
      <div className={`flex justify-between text-xs font-mono mb-2 ${AXEL_TEXT_SECONDARY}`}>
        <span>{label}</span>
        <span className="tabular-nums">{clampedPct}%</span>
      </div>
      <div className={`${AXEL_PROGRESS_THICK} relative`}>
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-sl ${color}`}
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
  color = 'stroke-accent',
  trackColor = 'stroke-chrome',
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

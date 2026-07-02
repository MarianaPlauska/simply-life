import { motion } from 'framer-motion';
import { AXEL_ANALYTICS_CARD, AXEL_PROGRESS_THICK, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces';

/** Bloco com efeito shimmer — respeita tokens do tema */
export function Shimmer({ className = '' }: { className?: string })
{
  return (
    <div className={`sl-shimmer rounded-sl ${className}`} aria-hidden />
  );
}

export function Skeleton({ className = '' }: { className?: string })
{
  return (
    <Shimmer className={className} />
  );
}

export function CardSkeleton()
{
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

interface BentoGridSkeletonProps
{
  variant?: 'health' | 'finance' | 'default'
}

/** Placeholders no formato Bento — evita tela vazia durante fetch */
export function BentoGridSkeleton({ variant = 'default' }: BentoGridSkeletonProps)
{
  if (variant === 'finance')
  {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando finanças">
        <Shimmer className="h-24 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Shimmer className="h-20" />
          <Shimmer className="h-20" />
          <Shimmer className="h-20" />
          <Shimmer className="h-20" />
        </div>
        <Shimmer className="h-40 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Shimmer className="h-52" />
          <Shimmer className="h-52" />
        </div>
      </div>
    );
  }

  if (variant === 'health')
  {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando saúde">
        <Shimmer className="h-28 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Shimmer className="h-24" />
          <Shimmer className="h-24" />
          <Shimmer className="h-24" />
          <Shimmer className="h-24" />
        </div>
        <Shimmer className="h-36 w-full" />
        <Shimmer className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      <Shimmer className="h-28 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Shimmer className="h-40" />
        <Shimmer className="h-40" />
      </div>
      <Shimmer className="h-32 w-full" />
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
})
{
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
})
{
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

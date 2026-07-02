/* eslint-disable react-refresh/only-export-components */
/**
 * DashboardPrimitives.tsx — Barrel re-exports from ui/ and utils/.
 * Keeps existing import paths working across dashboard sections.
 */

// ── Design System (ui/) ─────────────────────────────────────
export { GlassCard, glassVariants } from '../ui/GlassCard';
export type { GlassCardProps } from '../ui/GlassCard';
export { Skeleton, CardSkeleton, Shimmer, BentoGridSkeleton, ProgressBar, CircularProgress } from '../ui/Skeleton';
export { AmbientBackground } from '../ui/AmbientBackground';
export type { GradientZone } from '../ui/AmbientBackground';

// ── Animations (utils/) ─────────────────────────────────────
export { fadeUp, staggerContainer, staggerChild } from '../../utils/animations';

// ── Dashboard-specific primitives ───────────────────────────

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
          <div className="w-3 h-3 rounded-sl bg-concluido/15 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-sl bg-concluido" />
          </div>
        ) : (
          <div className="w-3 h-3 rounded-sl border border-line" />
        )}
        <span className={`text-[11px] font-mono ${ok ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
      </div>
      <span className={`font-mono text-[10px] tabular-nums ${ok ? 'text-concluido' : 'text-ink-muted'}`}>{detail}</span>
    </div>
  );
}

export function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

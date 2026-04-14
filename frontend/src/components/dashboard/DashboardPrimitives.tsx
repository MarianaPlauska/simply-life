/**
 * DashboardPrimitives.tsx — Barrel re-exports from ui/ and utils/.
 * Keeps existing import paths working across dashboard sections.
 */

// ── Design System (ui/) ─────────────────────────────────────
export { GlassCard, glassVariants } from '../ui/GlassCard';
export type { GlassCardProps } from '../ui/GlassCard';
export { Skeleton, CardSkeleton, ProgressBar, CircularProgress } from '../ui/Skeleton';
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

export function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

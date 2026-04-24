// empty state genérico — ícone glassmorphism + texto + cta violet
import type { ElementType } from 'react';

interface EmptyStateProps
{
  icon: ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps)
{
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
      {/* ícone em caixa glassmorphism */}
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/40 backdrop-blur-sm border border-white/[0.06]
                      flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.06)]">
        <Icon className="w-7 h-7 text-zinc-500" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <p className="text-[15px] font-semibold text-zinc-200">{title}</p>
        <p className="text-[13px] text-zinc-500 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 px-5 py-2.5 rounded-xl text-[13px] font-semibold
                     bg-violet-600/15 text-violet-300 border border-violet-500/20
                     hover:bg-violet-600/25 hover:border-violet-500/30
                     transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

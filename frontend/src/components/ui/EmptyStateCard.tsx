import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps
{
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  accentColor?: string;   // ex: 'violet', 'emerald', 'cyan'
  children?: ReactNode;
}

/**
 * EmptyStateCard — substitui o "—" e "0%" com uma chamada visual
 *
 * Nunca mostra dados vazios sem contexto.
 * Sempre tem um ícone grande animado + CTA motivacional.
 */
export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  accentColor = 'violet',
  children,
}: EmptyStateCardProps)
{
  // mapa de cores pro accent
  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    violet: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20 hover:border-violet-400/40',
      glow: 'from-violet-500 to-indigo-500',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20 hover:border-emerald-400/40',
      glow: 'from-emerald-500 to-teal-500',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20 hover:border-cyan-400/40',
      glow: 'from-cyan-500 to-blue-500',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20 hover:border-amber-400/40',
      glow: 'from-amber-500 to-orange-500',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20 hover:border-red-400/40',
      glow: 'from-red-500 to-rose-500',
    },
  };

  const colors = colorMap[accentColor] || colorMap.violet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center py-8 px-6"
    >
      {/* ícone flutuante com animação sutil */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mb-5`}
      >
        <Icon className={`w-8 h-8 ${colors.text}`} />
      </motion.div>

      {/* título */}
      <h4 className="text-[15px] font-semibold text-zinc-200 mb-1.5">
        {title}
      </h4>

      {/* descrição */}
      <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[240px] mb-5">
        {description}
      </p>

      {/* CTA button com gradient */}
      {ctaLabel && onCta && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCta}
          className={`
            px-5 py-2.5 rounded-xl text-[12px] font-semibold
            bg-gradient-to-r ${colors.glow}
            text-white shadow-lg shadow-black/20
            border ${colors.border}
            transition-all duration-300
          `}
        >
          {ctaLabel}
        </motion.button>
      )}

      {children}
    </motion.div>
  );
}

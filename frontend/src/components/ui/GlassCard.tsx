import { useRef, useCallback, type ReactNode } from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export const glassVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export type GlassCardProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
  /** desativa o efeito de glow dinâmico */
  noGlow?: boolean;
} & Omit<HTMLMotionProps<'div'>, 'children'>;

/**
 * GlassCard v2 — Glow Dinâmico que segue o mouse
 *
 * Inspirado no Linear app e Vercel dashboard.
 * Um radial-gradient acompanha o cursor via CSS variables,
 * criando a sensação de uma lanterna atrás de vidro fosco.
 */
export function GlassCard({
  children,
  className = '',
  noPadding = false,
  hover = true,
  noGlow = false,
  variants = glassVariants,
  ...rest
}: GlassCardProps)
{
  const glowRef = useRef<HTMLDivElement>(null);

  // atualiza as CSS variables com a posição do mouse
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) =>
  {
    if (noGlow || !glowRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glowRef.current.style.setProperty('--glow-x', `${x}%`);
    glowRef.current.style.setProperty('--glow-y', `${y}%`);
    glowRef.current.style.opacity = '1';
  }, [noGlow]);

  const handleMouseLeave = useCallback(() =>
  {
    if (glowRef.current)
    {
      glowRef.current.style.opacity = '0';
    }
  }, []);

  const classes = [
    'relative overflow-hidden group',
    'bg-zinc-950/50 backdrop-blur-2xl',
    'border border-white/5 rounded-[2rem] shadow-2xl',
    'transition-all duration-300',
    hover ? 'hover:border-violet-500/20' : '',
    noPadding ? '' : 'p-8',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      variants={variants}
      className={classes}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* glow layer — radial-gradient segue o cursor */}
      {!noGlow && (
        <div
          ref={glowRef}
          className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle 350px at var(--glow-x, 50%) var(--glow-y, 50%),
              rgba(139,92,246,0.07), transparent 60%)`,
          }}
        />
      )}

      {/* borda luminosa no hover — efeito sutil de edge glow */}
      {!noGlow && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0 rounded-[2rem]"
          style={{
            background: `radial-gradient(circle 200px at var(--glow-x, 50%) var(--glow-y, 50%),
              rgba(139,92,246,0.12), transparent 50%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* conteúdo real sempre acima do glow */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

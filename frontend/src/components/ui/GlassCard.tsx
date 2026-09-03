/* eslint-disable react-refresh/only-export-components */
import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export const glassVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export type GlassCardProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
  /** @deprecated glow removido - mantido por compatibilidade */
  noGlow?: boolean;
} & Omit<HTMLMotionProps<'div'>, 'children'>;

/** Painel editorial - borda fina, sem glassmorphism nem glow */
export function GlassCard({
  children,
  className = '',
  noPadding = false,
  hover = true,
  variants = glassVariants,
  ...rest
}: GlassCardProps)
{
  const classes = [
    'relative sl-panel',
    'transition-colors duration-200',
    hover ? 'hover:border-ink-muted/50' : '',
    noPadding ? '' : 'p-6',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div variants={variants} className={classes} {...rest}>
      {children}
    </motion.div>
  );
}

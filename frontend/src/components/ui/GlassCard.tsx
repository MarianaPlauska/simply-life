import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';


export const glassVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
 
  noPadding?: boolean;
  
  hover?: boolean;
} & Omit<HTMLMotionProps<'div'>, 'children'>;

export function GlassCard({
  children,
  className = '',
  noPadding = false,
  hover = true,
  variants = glassVariants,
  ...rest
}: GlassCardProps) {
  const classes = [
    'relative overflow-hidden',
    'bg-zinc-950/50 backdrop-blur-2xl',
    'border border-white/5 rounded-[2rem] shadow-2xl',
    'transition-all duration-300',
    hover  ? 'hover:border-violet-500/20' : '',
    noPadding ? '' : 'p-8',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div variants={variants} className={classes} {...rest}>
      {children}
    </motion.div>
  );
}

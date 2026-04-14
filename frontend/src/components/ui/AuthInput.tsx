/**
 * ui/AuthInput.tsx — Input de autenticação (reutilizável, sem lógica de negócio)
 */
import type { ReactNode } from 'react';

const BASE =
  'w-full bg-zinc-950/80 border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: ReactNode;
  suffix?: ReactNode;
}

export function AuthInput({ id, label, icon, suffix, className = '', ...props }: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
          {icon}
        </span>
        <input id={id} className={`${BASE} ${suffix ? 'pr-10' : ''} ${className}`} {...props} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

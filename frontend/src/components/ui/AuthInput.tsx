/**
 * ui/AuthInput.tsx — Input de autenticação (reutilizável, sem lógica de negócio)
 */
import type { ReactNode } from 'react';

const BASE =
  'w-full bg-chrome border border-line rounded-sl pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-accent';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: ReactNode;
  suffix?: ReactNode;
}

export function AuthInput({ id, label, icon, suffix, className = '', ...props }: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-mono text-[10px] font-medium text-ink-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
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

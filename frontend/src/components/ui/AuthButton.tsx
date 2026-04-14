/**
 * ui/AuthButton.tsx — Botão primário de submit com estado loading (sem lógica de negócio)
 */
import { ArrowRight, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  loading: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel: string;
}

export function AuthButton({ loading, disabled, label, loadingLabel }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group relative w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-110 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
    >
      {/* shimmer on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </span>
    </button>
  );
}

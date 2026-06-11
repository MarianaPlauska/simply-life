/**
 * ui/AuthButton.tsx — Botão primário de submit com estado loading (sem lógica de negócio)
 */
import { ArrowRight, Loader2 } from 'lucide-react';
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces';

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
      className={`group w-full flex items-center justify-center gap-2 py-3 px-4 text-sm ${AXEL_BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
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
    </button>
  );
}

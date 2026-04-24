// botão reutilizável de impressão — chama window.print() e se esconde no @media print
import { Printer } from 'lucide-react';

interface PrintButtonProps
{
  label?: string;
  className?: string;
}

export function PrintButton ({ label = 'Imprimir', className = '' }: PrintButtonProps)
{
  return (
    <button
      onClick={() => window.print()}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium
        text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/50
        rounded-lg hover:border-zinc-700 transition-all print:hidden ${className}`}
      aria-label={label}
    >
      <Printer className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

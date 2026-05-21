import { Link2 } from 'lucide-react';

interface ContextGroupBadgeProps
{
  titulo: string;
  cor: string;
  itemCount: number;
}

export function ContextGroupBadge({ titulo, cor, itemCount }: ContextGroupBadgeProps)
{
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-white/5 bg-zinc-950/40 transition-colors hover:bg-zinc-900/60 cursor-pointer"
      style={{ color: cor }}
      title={`Contexto: ${titulo} (${itemCount} itens relacionados)`}
    >
      <Link2 className="w-2.5 h-2.5" />
      {titulo}
    </span>
  );
}

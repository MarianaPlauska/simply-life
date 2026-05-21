import { useEffect, useState } from 'react';
import { Archive, Loader2, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';

export function ArquivoTab() {
  const { arquivo, arquivoLoading, fetchArquivo, restaurarTarefa } = useTaskStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded)
    {
      fetchArquivo();
      setLoaded(true);
    }
  }, [loaded, fetchArquivo]);

  if (arquivoLoading)
  {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (arquivo.length === 0)
  {
    return (
      <div className="text-center py-16 space-y-2">
        <Archive className="w-6 h-6 text-zinc-650 mx-auto" />
        <p className="text-[13px] text-zinc-400 font-medium">Arquivo vazio</p>
        <p className="text-[11px] text-zinc-600">Tarefas excluídas aparecem aqui e podem ser restauradas para o painel ativo.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-900/60 max-w-3xl mx-auto">
      {arquivo.map((t) => {
        return (
          <div 
            key={t.id} 
            className="flex items-center justify-between py-3.5 hover:bg-white/[0.01] -mx-3 px-3 rounded-lg group transition-all duration-150"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-zinc-300 font-medium group-hover:text-white transition-colors truncate">
                {t.titulo}
              </p>
              <div className="flex items-center gap-2.5 mt-1 text-[10px] text-zinc-600">
                <span className="font-mono">#{t.id}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="capitalize">{t.status.replace('_', ' ')}</span>
                {t.prioridade && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className="capitalize">{t.prioridade}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                await restaurarTarefa(t.id);
                toast.success('Tarefa restaurada');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium 
                         text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 
                         rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

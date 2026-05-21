import { Search, X, SlidersHorizontal } from 'lucide-react';

interface Label {
  id: number;
  nome: string;
  cor: string;
}

interface BoardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterPrio: string | null;
  setFilterPrio: (prio: string | null) => void;
  filterOrigem: string | null;
  setFilterOrigem: (origem: string | null) => void;
  filterLabel: number | null;
  setFilterLabel: (label: number | null) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  labels: Label[];
}

const PRIORIDADES = ['critica', 'alta', 'media', 'baixa'] as const;
const ORIGENS = ['manual', 'gmail_triage', 'gmail_mock', 'gmail_api', 'webhook'] as const;

export function BoardFilters({
  searchQuery,
  setSearchQuery,
  filterPrio,
  setFilterPrio,
  filterOrigem,
  setFilterOrigem,
  filterLabel,
  setFilterLabel,
  showFilters,
  setShowFilters,
  clearFilters,
  hasActiveFilters,
  labels,
}: BoardFiltersProps) {
  return (
    <div className="space-y-4">
      {/* busca e controle de filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              return setSearchQuery(e.target.value);
            }}
            placeholder="Buscar tarefas..."
            className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-lg pl-9 pr-3 py-1.5 
                       text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none 
                       focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                return setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* botao de filtros */}
        <button
          onClick={() => {
            return setShowFilters(!showFilters);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-violet-650/10 border-violet-500/30 text-violet-400'
              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium ml-1"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* painel com as opcoes dos filtros */}
      {showFilters && (
        <div className="flex items-center gap-6 flex-wrap py-2 text-[11px] animate-in fade-in duration-200">
          {/* filtro de prioridade */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Prioridade</span>
            <div className="flex items-center gap-1">
              {PRIORIDADES.map((p: string) => {
                const active = filterPrio === p;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      return setFilterPrio(active ? null : p);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all capitalize ${
                      active
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 font-semibold'
                        : 'bg-zinc-900/20 border-zinc-850/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* filtro de origem */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Origem</span>
            <div className="flex items-center gap-1">
              {ORIGENS.map((o: string) => {
                const active = filterOrigem === o;
                return (
                  <button
                    key={o}
                    onClick={() => {
                      return setFilterOrigem(active ? null : o);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all ${
                      active
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 font-semibold'
                        : 'bg-zinc-900/20 border-zinc-850/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                    }`}
                  >
                    {o.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* filtro de marcadores */}
          {labels.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Marcadores</span>
              <div className="flex items-center gap-1">
                {labels.map((lb) => {
                  const active = filterLabel === lb.id;
                  return (
                    <button
                      key={lb.id}
                      onClick={() => {
                        return setFilterLabel(active ? null : lb.id);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md border transition-all ${
                        active
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 font-semibold'
                          : 'bg-zinc-900/20 border-zinc-850/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: lb.cor }}
                      />
                      <span>{lb.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

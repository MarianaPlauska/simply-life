// command palette com busca real integrada ao motor de busca global
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  KanbanSquare,
  StickyNote,
  CalendarDays,
  Wallet,
  Pill,
  Settings,
  User,
  Zap,
  Plus,
  Search,
  Loader2,
  FileText,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { looksLikeFinanceCapture, parseFinanceQuickCapture } from '../../lib/financeQuickCapture';

type CommandGroup = 'Resultados' | 'Navegar' | 'Ações';

interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon: LucideIcon;
  shortcut?: string;
  subtitle?: string;
  action: () => void;
}

export function CommandPalette ()
{
  const navigate = useNavigate();
  const isOpen = useTaskStore((s) => s.isCommandPaletteOpen);
  const setOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const setQuickCapture = useTaskStore((s) => s.setQuickCaptureOpen);
  const setFinanceQuickCapture = useTaskStore((s) => s.setFinanceQuickCaptureOpen);
  const setFinanceQuickCaptureSeed = useTaskStore((s) => s.setFinanceQuickCaptureSeed);
  const buscar = useTaskStore((s) => s.buscar);
  const searchResults = useTaskStore((s) => s.searchResults);
  const searchLoading = useTaskStore((s) => s.searchLoading);
  const setActiveView = useTaskStore((s) => s.setActiveView);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const close = useCallback(() =>
  {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, [setOpen]);

  // atalho global ctrl+k / cmd+k pra abrir
  useEffect(() =>
  {
    const handler = (e: KeyboardEvent) =>
    {
      if ( (e.ctrlKey || e.metaKey) && e.key === 'k' )
      {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  // foca o input quando abre
  useEffect(() =>
  {
    if ( isOpen )
    {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // debounce da busca - dispara 250ms depois de parar de digitar
  useEffect(() =>
  {
    if ( debounceRef.current ) clearTimeout(debounceRef.current);

    if ( query.trim().length >= 2 )
    {
      debounceRef.current = setTimeout(() => buscar(query), 250);
    }

    return () =>
    {
      if ( debounceRef.current ) clearTimeout(debounceRef.current);
    };
  }, [query, buscar]);

  // ── comandos estáticos ─────────────────────────────────────
  const STATIC_COMMANDS: Command[] = [
    { id: 'dashboard', label: 'Dashboard', group: 'Navegar', icon: LayoutDashboard, action: () => { navigate('/'); close(); } },
    { id: 'kanban', label: 'Kanban', group: 'Navegar', icon: KanbanSquare, action: () => { navigate('/kanban'); close(); } },
    { id: 'anotacoes', label: 'Anotações', group: 'Navegar', icon: StickyNote, action: () => { navigate('/anotacoes'); close(); } },
    { id: 'calendario', label: 'Calendário', group: 'Navegar', icon: CalendarDays, action: () => { navigate('/calendario'); close(); } },
    { id: 'financeiro', label: 'Controle de Gastos', group: 'Navegar', icon: Wallet, action: () => { navigate('/financeiro'); close(); } },
    { id: 'saude', label: 'Saúde & Hábitos', group: 'Navegar', icon: Pill, action: () => { navigate('/saude'); close(); } },
    { id: 'configuracoes', label: 'Configurações', group: 'Navegar', icon: Settings, action: () => { navigate('/configuracoes'); close(); } },
    { id: 'perfil', label: 'Perfil', group: 'Navegar', icon: User, action: () => { navigate('/perfil'); close(); } },
    {
      id: 'quickcapture', label: 'Captura Rápida', group: 'Ações', icon: Zap, shortcut: 'Q',
      action: () => { close(); setQuickCapture(true); },
    },
    {
      id: 'financequick', label: 'Lançar gasto / receita', group: 'Ações', icon: Wallet,
      action: () => { close(); setFinanceQuickCaptureSeed(''); setFinanceQuickCapture(true); },
    },
    {
      id: 'newtask', label: 'Nova Tarefa', group: 'Ações', icon: Plus,
      action: () => { navigate('/kanban'); close(); },
    },
  ];

  const financeParsed = parseFinanceQuickCapture(query.trim());

  // ── comandos dinâmicos baseados na busca da api ────────────
  const searchCommands: Command[] = [];

  if (financeParsed && looksLikeFinanceCapture(query.trim()))
  {
    searchCommands.push({
      id: 'finance-capture-inline',
      label: `Lançar ${financeParsed.tipo}: ${financeParsed.descricao}`,
      subtitle: financeParsed.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      group: 'Ações',
      icon: Wallet,
      action: () =>
      {
        close();
        setFinanceQuickCaptureSeed(query.trim());
        setFinanceQuickCapture(true);
      },
    });
  }

  if ( searchResults && query.trim().length >= 2 )
  {
    // tarefas encontradas pela busca
    for ( const t of searchResults.tarefas )
    {
      const isIA = t.origem === 'gmail_triage' || t.origem === 'gmail_mock';
      searchCommands.push({
        id: `search-tarefa-${t.id}`,
        label: t.titulo,
        subtitle: `${t.prioridade} · ${t.status}`,
        group: 'Resultados',
        icon: isIA ? Sparkles : ListChecks,
        action: () =>
        {
          setActiveView('kanban');
          navigate('/kanban');
          close();
        },
      });
    }

    // anotações encontradas pela busca
    for ( const a of searchResults.anotacoes )
    {
      searchCommands.push({
        id: `search-nota-${a.id}`,
        label: a.titulo || 'Sem título',
        subtitle: a.preview.slice(0, 60) + (a.preview.length > 60 ? '...' : ''),
        group: 'Resultados',
        icon: FileText,
        action: () =>
        {
          setActiveView('anotacoes');
          navigate('/anotacoes');
          close();
        },
      });
    }
  }

  // ── filtragem local nos comandos estáticos ──────────────────
  const filteredStatic = query.trim()
    ? STATIC_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : STATIC_COMMANDS;

  // combina resultados da api + comandos locais
  const allCommands = [...searchCommands, ...filteredStatic];

  const groups: CommandGroup[] = ['Resultados', 'Ações', 'Navegar'];
  const flatList = groups.flatMap((g) => allCommands.filter((c) => c.group === g));

  // navegação com teclado
  useEffect(() =>
  {
    if ( !isOpen ) return;
    const handler = (e: KeyboardEvent) =>
    {
      if ( e.key === 'Escape' ) { close(); return; }
      if ( e.key === 'ArrowDown' )
      {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
      }
      if ( e.key === 'ArrowUp' )
      {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if ( e.key === 'Enter' )
      {
        e.preventDefault();
        flatList[selectedIndex]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatList, selectedIndex, close]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  // auto-scroll pro item selecionado
  useEffect(() =>
  {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  let flatIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-start justify-center pt-[15vh]"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-xl mx-4 bg-card border border-line rounded-sl-lg shadow-sl-lg overflow-hidden"
          >
            {/* input de busca - mostra spinner quando está carregando */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
              {searchLoading
                ? <Loader2 className="w-4 h-4 text-ink shrink-0 animate-spin" />
                : <Search className="w-4 h-4 text-ink-muted shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar… ou gastei 45 almoço"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-ink placeholder:text-ink-faint text-sm outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-chrome border border-line text-ink-muted text-xs font-mono">
                ESC
              </kbd>
            </div>

            {/* resultados */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
              {flatList.length === 0 ? (
                <p className="text-center text-ink-muted text-sm py-8">Nenhum resultado para &quot;{query}&quot;</p>
              ) : (
                groups.map((group) =>
                {
                  const items = allCommands.filter((c) => c.group === group);
                  if ( !items.length ) return null;
                  return (
                    <div key={group}>
                      <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-ink-muted">
                        {group === 'Resultados' && searchResults
                          ? `Resultados (${searchResults.total})`
                          : group
                        }
                      </p>
                      {items.map((cmd) =>
                      {
                        const idx = flatIdx++;
                        const isSelected = idx === selectedIndex;
                        return (
                          <button
                            key={cmd.id}
                            data-idx={idx}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={cmd.action}
                            className={[
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              isSelected ? 'bg-chrome text-ink' : 'text-ink-muted hover:bg-chrome/60',
                            ].join(' ')}
                          >
                            <div className={[
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              isSelected ? 'bg-elevated' : 'bg-chrome',
                            ].join(' ')}>
                              <cmd.icon className={['w-4 h-4', isSelected ? 'text-ink' : 'text-ink-muted'].join(' ')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block truncate">{cmd.label}</span>
                              {cmd.subtitle && (
                                <span className="text-[11px] text-ink-muted block truncate">{cmd.subtitle}</span>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 rounded bg-chrome border border-line text-ink-muted text-xs font-mono">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-line text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded bg-chrome border border-line font-mono text-[10px]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded bg-chrome border border-line font-mono text-[10px]">⏎</kbd>
                abrir
              </span>
              <span className="ml-auto">Ctrl+K para fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

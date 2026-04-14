// frontend/src/components/ui/CommandPalette.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  KanbanSquare,
  StickyNote,
  Crosshair,
  CalendarDays,
  Wallet,
  PiggyBank,
  Pill,
  HardDrive,
  Settings,
  User,
  Filter,
  SlidersHorizontal,
  Briefcase,
  Zap,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

type CommandGroup = 'Navegar' | 'Ações';

interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const isOpen = useTaskStore((s) => s.isCommandPaletteOpen);
  const setOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const setQuickCapture = useTaskStore((s) => s.setQuickCaptureOpen);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, [setOpen]);

  // Global Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const ALL_COMMANDS: Command[] = [
    { id: 'dashboard', label: 'Dashboard', group: 'Navegar', icon: LayoutDashboard, action: () => { navigate('/'); close(); } },
    { id: 'kanban', label: 'Kanban', group: 'Navegar', icon: KanbanSquare, action: () => { navigate('/kanban'); close(); } },
    { id: 'anotacoes', label: 'Anotações', group: 'Navegar', icon: StickyNote, action: () => { navigate('/anotacoes'); close(); } },
    { id: 'foco', label: 'Modo Foco', group: 'Navegar', icon: Crosshair, action: () => { navigate('/foco'); close(); } },
    { id: 'calendario', label: 'Calendário', group: 'Navegar', icon: CalendarDays, action: () => { navigate('/calendario'); close(); } },
    { id: 'financeiro', label: 'Controle de Gastos', group: 'Navegar', icon: Wallet, action: () => { navigate('/financeiro'); close(); } },
    { id: 'planner', label: 'Planejador 50/30/20', group: 'Navegar', icon: PiggyBank, action: () => { navigate('/planner'); close(); } },
    { id: 'saude', label: 'Saúde & Hábitos', group: 'Navegar', icon: Pill, action: () => { navigate('/saude'); close(); } },
    { id: 'drive', label: 'Vault / Drive', group: 'Navegar', icon: HardDrive, action: () => { navigate('/drive'); close(); } },
    { id: 'inteligencia', label: 'Filtro de Keywords', group: 'Navegar', icon: Filter, action: () => { navigate('/inteligencia'); close(); } },
    { id: 'preferencias', label: 'Preferências IA', group: 'Navegar', icon: SlidersHorizontal, action: () => { navigate('/preferencias'); close(); } },
    { id: 'carreira', label: 'Radar de Carreira', group: 'Navegar', icon: Briefcase, action: () => { navigate('/carreira'); close(); } },
    { id: 'configuracoes', label: 'Configurações', group: 'Navegar', icon: Settings, action: () => { navigate('/configuracoes'); close(); } },
    { id: 'perfil', label: 'Perfil', group: 'Navegar', icon: User, action: () => { navigate('/perfil'); close(); } },
    {
      id: 'quickcapture', label: 'Captura Rápida', group: 'Ações', icon: Zap, shortcut: 'Q',
      action: () => { close(); setQuickCapture(true); },
    },
    {
      id: 'newtask', label: 'Nova Tarefa', group: 'Ações', icon: Plus,
      action: () => { navigate('/kanban'); close(); },
    },
    {
      id: 'search', label: 'Buscar Tarefas', group: 'Ações', icon: Search,
      action: () => { navigate('/kanban'); close(); },
    },
  ];

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_COMMANDS;

  const groups: CommandGroup[] = ['Navegar', 'Ações'];

  const flatList = groups.flatMap((g) => filtered.filter((c) => c.group === g));

 
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        flatList[selectedIndex]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatList, selectedIndex, close]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  
  useEffect(() => {
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
            className="w-full max-w-xl mx-4 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar comandos e páginas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
              {flatList.length === 0 ? (
                <p className="text-center text-zinc-600 text-sm py-8">Nenhum resultado para &quot;{query}&quot;</p>
              ) : (
                groups.map((group) => {
                  const items = filtered.filter((c) => c.group === group);
                  if (!items.length) return null;
                  return (
                    <div key={group}>
                      <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
                        {group}
                      </p>
                      {items.map((cmd) => {
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
                              isSelected ? 'bg-violet-500/20 text-zinc-50' : 'text-zinc-300 hover:bg-zinc-800/60',
                            ].join(' ')}
                          >
                            <div className={[
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              isSelected ? 'bg-violet-500/30' : 'bg-zinc-800',
                            ].join(' ')}>
                              <cmd.icon className={['w-4 h-4', isSelected ? 'text-violet-300' : 'text-zinc-500'].join(' ')} />
                            </div>
                            <span className="flex-1 text-sm font-medium">{cmd.label}</span>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-mono">
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

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/8 text-[11px] text-zinc-600">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px]">⏎</kbd>
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

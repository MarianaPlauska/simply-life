import { Zap, Columns, LineChart } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

const NAV_ITEMS = [
  { id: 'superhuman' as const, label: 'Superhuman', icon: Zap },
  { id: 'kanban' as const, label: 'Kanban Temporal', icon: Columns },
  { id: 'dashboard' as const, label: 'Dashboard', icon: LineChart },
];

export function Header() {
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);

  return (
    <header className="bg-card border-b border-zinc-700/50 p-4 flex items-center justify-between shadow-sm z-10">
      <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <Zap className="text-ia w-6 h-6" />
        Orquestrador
      </h1>

      <nav className="flex bg-zinc-900/50 rounded-lg p-1 border border-zinc-700/50">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-ia/20 text-ia font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">Score de Foco: <strong className="text-concluido">85%</strong></span>
        <div className="w-8 h-8 rounded-full bg-zinc-600 border-2 border-ia cursor-pointer"></div>
      </div>
    </header>
  );
}
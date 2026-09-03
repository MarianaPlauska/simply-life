import { Code2, Mail, MessageSquare, RefreshCw, CheckCircle2, Key } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: number;
  icon: LucideIcon;
  color: string;
  text: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: 1, icon: Key, color: 'text-emerald-400', text: 'Token do GitHub validado com sucesso', time: '2 min atrás' },
  { id: 2, icon: RefreshCw, color: 'text-violet-400', text: 'Worker atualizou 3 tarefas', time: '15 min atrás' },
  { id: 3, icon: Code2, color: 'text-zinc-400', text: 'PR #482 ingerido via GitHub', time: '28 min atrás' },
  { id: 4, icon: Mail, color: 'text-amber-400', text: 'Novo e-mail classificado - Gmail', time: '1h atrás' },
  { id: 5, icon: CheckCircle2, color: 'text-emerald-400', text: 'Sessão de foco concluída (25 min)', time: '2h atrás' },
  { id: 6, icon: MessageSquare, color: 'text-blue-400', text: 'Resumo do standup processado - Teams', time: '3h atrás' },
];

export function ActivityLog() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">Atividade Recente</h3>
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-800/60" />

        <div className="space-y-0.5">
          {ACTIVITIES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="relative flex items-start gap-4 py-2.5 pl-0 group"
              >
                {/* Icon Dot */}
                <div className="relative z-10 p-1.5 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700/50 shrink-0">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[13px] text-zinc-300 group-hover:text-white transition-colors truncate">
                    {item.text}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

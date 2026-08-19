import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks, Pill, DollarSign, Brain, Activity,
  CheckCircle2, Sparkles, ChevronRight, Rocket,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTaskStore } from '../../store/useTaskStore';
import type { ActiveView } from '../../store/useTaskStore';

/* ══════════════════════════════════════════════════════════════
   SetupQuestsSection — Onboarding Gamificado
   Aparece quando o usuário novo tem < 3 módulos configurados.
   Micro-missões guiam o setup enquanto geram XP.
   ══════════════════════════════════════════════════════════════ */

interface Quest
{
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  xp: number;
  accent: string;
  view: ActiveView;
  checkFn: () => boolean; // retorna true se já completou
}

// confetti removido — visual minimalista, sem efeitos exagerados

export function SetupQuestsSection()
{
  const tarefas = useTaskStore((s) => s.tarefas);
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const keywords = useTaskStore((s) => s.keywords);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const transactions = useTaskStore((s) => s.transactions);
  const habitos = useTaskStore((s) => s.habitos);
  const dismissed = useTaskStore((s) => s.onboardingDismissed);
  const dismiss = useTaskStore((s) => s.dismissOnboarding);

  // lista de quests com verificação dinâmica
  const quests: Quest[] = [
    {
      id: 'first-task',
      icon: ListChecks,
      title: 'Criar primeira tarefa',
      description: 'Organize seu dia no Kanban',
      xp: 50,
      accent: 'violet',
      view: 'kanban',
      checkFn: () =>
      {
        return tarefas.length > 0;
      },
    },
    {
      id: 'first-med',
      icon: Pill,
      title: 'Adicionar medicamento',
      description: 'Controle sua rotina de saúde',
      xp: 30,
      accent: 'emerald',
      view: 'saude',
      checkFn: () =>
      {
        return (medicamentos ?? []).length > 0;
      },
    },
    {
      id: 'first-expense',
      icon: DollarSign,
      title: 'Registrar primeiro gasto',
      description: 'Comece a rastrear suas finanças',
      xp: 40,
      accent: 'cyan',
      view: 'financeiro',
      checkFn: () =>
      {
        return transactions.length > 0;
      },
    },
    {
      id: 'setup-keywords',
      icon: Brain,
      title: 'Definir palavras-chave',
      description: 'Ative o Motor de Triagem IA',
      xp: 25,
      accent: 'amber',
      view: 'configuracoes',
      checkFn: () =>
      {
        return keywords.length > 0;
      },
    },
    {
      id: 'first-habit',
      icon: Activity,
      title: 'Criar um hábito',
      description: 'Construa sua rotina diária',
      xp: 35,
      accent: 'emerald',
      view: 'saude',
      checkFn: () =>
      {
        return habitos.length > 0;
      },
    },
  ];

  // calcula quais estão completas
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  useEffect(() =>
  {
    const newCompleted = new Set<string>();
    quests.forEach((q) =>
    {
      if (q.checkFn())
      {
        newCompleted.add(q.id);
      }
    });

    // detecta se alguma nova quest foi completada (sem confetti)
    newCompleted.forEach((id) =>
    {
      if (!completedIds.has(id))
      {
        setJustCompleted(id);
        setTimeout(() =>
        {
          setJustCompleted(null);
        }, 2000);
      }
    });

    setCompletedIds(newCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefas.length, (medicamentos ?? []).length, keywords.length, transactions.length, habitos.length]);

  const completedCount = completedIds.size;
  const totalCount = quests.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const handleNavigate = useCallback((view: ActiveView) =>
  {
    setActiveView(view);
  }, [setActiveView]);

  if (dismissed || completedCount === totalCount)
  {
    return null;
  }

  // mapa de cores
  const accentMap: Record<string, { bg: string; text: string; border: string }> = {
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/15' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15' },
    cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/15' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/15' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <GlassCard className="!border-violet-500/10">
        {/* gradiente de fundo sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.06),transparent_50%)] pointer-events-none z-0" />

        {/* header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center relative">
                <Rocket className="w-5 h-5 text-violet-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  Setup do Simply-Life
                  <span className="text-[11px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    +{quests.reduce((sum, q) =>
                    {
                      return sum + q.xp;
                    }, 0)} XP
                  </span>
                </h3>
                <p className="text-[12px] text-zinc-600">
                  Complete {totalCount - completedCount} missão{totalCount - completedCount !== 1 ? 'ões' : ''} para desbloquear o sistema completo
                </p>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Pular
            </button>
          </div>

          {/* barra de progresso geral */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-zinc-500">Progresso do Setup</span>
              <span className="text-[12px] font-bold text-violet-400 tabular-nums">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-900/80 overflow-hidden border border-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* grid de quests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {quests.map((quest) =>
              {
                const done = completedIds.has(quest.id);
                const justDone = justCompleted === quest.id;
                const colors = accentMap[quest.accent] || accentMap.violet;
                const Icon = quest.icon;

                return (
                  <motion.button
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      scale: justDone ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    onClick={() => !done && handleNavigate(quest.view)}
                    disabled={done}
                    className={`
                      relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left
                      transition-all duration-300
                      ${done
                        ? 'bg-emerald-500/[0.04] border border-emerald-500/15 cursor-default'
                        : `bg-zinc-900/30 border border-dashed ${colors.border} hover:bg-zinc-800/30 hover:border-solid cursor-pointer`
                      }
                    `}
                  >
                    {/* ícone */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-500/10' : colors.bg}`}>
                      {done
                        ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                        : <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                      }
                    </div>

                    {/* texto */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${done ? 'text-emerald-300 line-through' : 'text-zinc-200'}`}>
                        {quest.title}
                      </p>
                      <p className="text-[11px] text-zinc-600 truncate">{quest.description}</p>
                    </div>

                    {/* badge xp ou seta */}
                    {done ? (
                      <span className="shrink-0 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        +{quest.xp} XP
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                    )}

                    {/* flash de celebração */}
                    {justDone && (
                      <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 rounded-2xl bg-emerald-400/10 pointer-events-none"
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* motivação */}
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[12px] text-zinc-500">
              {completedCount === 0
                ? 'Comece por qualquer missão — cada passo conta!'
                : completedCount < 3
                  ? `Ótimo começo! Faltam ${totalCount - completedCount} para o setup completo.`
                  : 'Quase lá! Complete as últimas missões para desbloquear tudo.'
              }
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

import { useTaskStore } from '../../store/useTaskStore'
import { totalMlHoje, metaMl, registrosMl } from '../../lib/waterHydration'

export function DashboardAnalyticsPanel()
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const habitos = useTaskStore((s) => s.habitos)
  const tarefas = useTaskStore((s) => s.tarefas)

  const agua = habitos.find((h) => h.tipo === 'agua')
  const waterToday = totalMlHoje(agua)
  const waterGoalMl = metaMl(agua)
  const waterCups = registrosMl(agua).length
  const tarefasAtivas = tarefas.filter((t) => t.status !== 'concluida').length
  const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluida').length

  return (
    <section className="sl-panel p-4 sm:p-5" aria-labelledby="daily-summary-title">
      <div>
        <p className="font-mono text-ui-caption uppercase tracking-[0.14em] text-accent">Hoje</p>
        <h2 id="daily-summary-title" className="font-sans font-semibold tracking-tight text-ui-heading text-ink mt-1">
          Resumo do dia
        </h2>
      </div>
      <ul className="mt-3 divide-y divide-line rounded-sl border border-line bg-card" role="list">
        <li className="px-3 py-2.5 text-ui-body text-ink">
          <span className="font-medium">Humor:</span>{' '}
          {humorHojeLista.length > 0 ? 'registrado hoje.' : 'ainda não registrado.'}
        </li>
        <li className="px-3 py-2.5 text-ui-body text-ink">
          <span className="font-medium">Hidratação:</span>{' '}
          {waterCups} copo{waterCups !== 1 ? 's' : ''} · {waterToday} de {waterGoalMl} ml.
        </li>
        <li className="px-3 py-2.5 text-ui-body text-ink">
          <span className="font-medium">Tarefas:</span>{' '}
          {tarefasConcluidas} concluída{tarefasConcluidas !== 1 ? 's' : ''} · {tarefasAtivas} ativa{tarefasAtivas !== 1 ? 's' : ''}.
        </li>
      </ul>
    </section>
  )
}

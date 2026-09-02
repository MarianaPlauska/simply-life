import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { FinanceGoalCard } from './goals/FinanceGoalCard'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import {
  estimateMonthlySavings,
  projectFinancialGoal,
} from '../../lib/financeGoalProjection'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { useTaskStore } from '../../store/useTaskStore'
import type { FinancialGoal, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceGoalsTabProps
{
  financialGoals: FinancialGoal[]
  monthTransactions: Transaction[]
  editingMeta: number | null
  setEditingMeta: (id: number | null) => void
  metaEditVal: string
  setMetaEditVal: (v: string) => void
  updateGoalProgress: (id: number, val: number) => void
  setShowGoalModal: (show: boolean) => void
  onNavigate?: (tab: FinanceAlertTab) => void
}

export function FinanceGoalsTab({
  financialGoals,
  monthTransactions,
  editingMeta,
  setEditingMeta,
  metaEditVal,
  setMetaEditVal,
  updateGoalProgress,
  setShowGoalModal,
  onNavigate,
}: FinanceGoalsTabProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)

  const alerts = useFinanceAlerts(monthTransactions)

  const monthlySavings = useMemo(
    () => estimateMonthlySavings(transactions, recurringIncomes, contasFixas),
    [transactions, recurringIncomes, contasFixas],
  )

  const projections = useMemo(() =>
  {
    const map = new Map<number, ReturnType<typeof projectFinancialGoal>>()
    for (const goal of financialGoals)
    {
      map.set(goal.id, projectFinancialGoal(goal, monthlySavings))
    }
    return map
  }, [financialGoals, monthlySavings])

  const handleSave = (id: number, raw: number) =>
  {
    if (Number.isNaN(raw) || raw < 0) return
    updateGoalProgress(id, raw)
    setEditingMeta(null)
  }

  return (
    <div className="space-y-4">
      <FinanceAlertsPanel alerts={alerts} onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={AXEL_SECTION_TITLE}>Metas financeiras</h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Sobra mensal estimada:{' '}
            <span className="font-mono text-accent">{fmt(monthlySavings)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGoalModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-sl bg-ink text-fundo font-mono text-[10px] uppercase"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financialGoals.map((meta) => (
          <FinanceGoalCard
            key={meta.id}
            meta={meta}
            projection={projections.get(meta.id)!}
            editing={editingMeta === meta.id}
            editVal={metaEditVal}
            onEditStart={() =>
            {
              setEditingMeta(meta.id)
              setMetaEditVal(String(meta.valor_atual))
            }}
            onEditVal={setMetaEditVal}
            onSave={(val) => handleSave(meta.id, val)}
            onCancel={() => setEditingMeta(null)}
          />
        ))}

        {financialGoals.length === 0 && (
          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="md:col-span-2 rounded-sl border border-dashed border-line py-12 text-center hover:border-accent/40 hover:bg-chrome/30 transition-colors"
          >
            <Plus className="w-6 h-6 mx-auto text-ink-muted mb-2" />
            <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>Criar primeira meta</p>
            <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Viagem, reserva de emergência, equipamento…
            </p>
          </button>
        )}
      </div>

      {financialGoals.length > 0 && (
        <section className={AXEL_BORDERLESS_PANEL}>
          <h3 className={`${AXEL_SECTION_TITLE} mb-4`}>Resumo geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Metas', value: String(financialGoals.length) },
              { label: 'Concluídas', value: String(financialGoals.filter((m) => m.concluida).length), tone: 'text-concluido' },
              { label: 'Acumulado', value: fmt(financialGoals.reduce((s, m) => s + m.valor_atual, 0)) },
              { label: 'Falta economizar', value: fmt(financialGoals.reduce((s, m) => s + Math.max(0, m.valor_alvo - m.valor_atual), 0)) },
            ].map((k) => (
              <div key={k.label}>
                <p className={`text-xl font-display tabular-nums ${k.tone ?? AXEL_TEXT_PRIMARY}`}>
                  {k.value}
                </p>
                <p className={`text-[10px] font-mono uppercase mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                  {k.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

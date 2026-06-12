import { useMemo } from 'react'
import type { Category, Transaction } from '../../store/storeTypes'
import { computeRule503020 } from '../../utils/rule503020'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_PROGRESS_THICK,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Rule503020SectionProps
{
  receita: number
  despesas: number
  monthTx: Transaction[]
  activeCategories: Category[]
}

export function Rule503020Section({
  receita,
  despesas,
  monthTx,
  activeCategories,
}: Rule503020SectionProps)
{
  const rule = useMemo(
    () => computeRule503020({ receita, despesas, monthTx, activeCategories }),
    [receita, despesas, monthTx, activeCategories],
  )

  const {
    realNecessidades,
    realDesejos,
    realPoupanca,
    pctNecessidades,
    pctDesejos,
    pctPoupanca,
    isCompliant,
  } = rule

  const blocks = [
    {
      label: 'Necessidades',
      meta: 50,
      pct: pctNecessidades,
      valor: realNecessidades,
      hint: 'Moradia, saúde, educação, alimentação e contas essenciais.',
      warn: pctNecessidades > 55,
    },
    {
      label: 'Desejos',
      meta: 30,
      pct: pctDesejos,
      valor: realDesejos,
      hint: 'Lazer, compras, viagens e estilo de vida.',
      warn: pctDesejos > 35,
    },
    {
      label: 'Poupança e reservas',
      meta: 20,
      pct: pctPoupanca,
      valor: realPoupanca,
      hint: 'Investimentos, metas de longo prazo e saldo livre.',
      warn: pctPoupanca < 15,
    },
  ]

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-line">
        <div>
          <h2 className={AXEL_SECTION_TITLE}>Distribuição 50-30-20</h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Meta vs real — baseado na receita do mês
          </p>
        </div>
        {receita > 0 && (
          <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-sl border ${
            isCompliant
              ? 'bg-concluido/10 text-concluido border-concluido/25'
              : 'bg-atencao/10 text-atencao border-atencao/25'
          }`}
          >
            {isCompliant ? 'Dentro da regra' : 'Ajustar gastos'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {blocks.map((block) => (
          <div key={block.label} className="space-y-2">
            <div className="flex justify-between text-[11px] gap-2">
              <span className={`font-medium ${AXEL_TEXT_PRIMARY}`}>
                {block.label} (meta {block.meta}%)
              </span>
              <span className={`font-mono tabular-nums shrink-0 ${AXEL_TEXT_SECONDARY}`}>
                {block.pct.toFixed(1)}%
                <span className="text-[9px] ml-1 opacity-70">({fmt(block.valor)})</span>
              </span>
            </div>
            <div className={`relative ${AXEL_PROGRESS_THICK}`}>
              <div
                className="absolute top-0 left-0 h-full bg-chrome border-r border-line"
                style={{ width: `${block.meta}%` }}
              />
              <div
                className={`h-full rounded-sl transition-all duration-500 ${
                  block.warn ? 'bg-atencao' : 'bg-accent'
                }`}
                style={{ width: `${Math.min(block.pct, 100)}%` }}
              />
            </div>
            <p className={`text-[9px] ${AXEL_TEXT_SECONDARY}`}>{block.hint}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

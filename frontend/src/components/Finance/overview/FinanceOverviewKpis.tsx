import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
} from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceOverviewKpisProps
{
  receita: number
  despesas: number
  saldo: number
}

export function FinanceOverviewKpis({ receita, despesas, saldo }: FinanceOverviewKpisProps)
{
  const saldoTone = saldo >= 0 ? 'text-finance' : 'text-urgente'

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className={AXEL_BORDERLESS_PANEL}>
        <p className={AXEL_SECTION_TITLE}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-concluido mr-1.5 align-middle" />
          Receitas
        </p>
        <p className={`text-xl sm:text-3xl font-display tabular-nums mt-2 break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
          {fmt(receita)}
        </p>
      </div>
      <div className={AXEL_BORDERLESS_PANEL}>
        <p className={AXEL_SECTION_TITLE}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-urgente/80 mr-1.5 align-middle" />
          Despesas
        </p>
        <p className={`text-xl sm:text-3xl font-display tabular-nums mt-2 break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
          {fmt(despesas)}
        </p>
      </div>
      <div className={`${AXEL_BORDERLESS_PANEL} relative overflow-hidden`}>
        <div
          className="absolute inset-0 bg-gradient-to-br from-finance/8 via-transparent to-transparent pointer-events-none"
          aria-hidden
        />
        <p className={`${AXEL_SECTION_TITLE} relative`}>Saldo do mês</p>
        <p className={`text-xl sm:text-3xl font-display tabular-nums mt-2 relative break-all sm:break-normal ${saldoTone}`}>
          {fmt(saldo)}
        </p>
      </div>
    </section>
  )
}

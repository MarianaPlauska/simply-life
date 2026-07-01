import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthKpisRowProps
{
  saldoDisponivel: number
  receita: number
  despesas: number
  saldoMes?: number
  balanceToneClass?: string
  compact?: boolean
  onConfigureSaldo?: () => void
}

export function FinanceMonthKpisRow({
  saldoDisponivel,
  receita,
  despesas,
  saldoMes,
  balanceToneClass = 'text-ink',
  compact = false,
  onConfigureSaldo,
}: FinanceMonthKpisRowProps)
{
  const items = [
    {
      label: 'Disponível',
      value: saldoDisponivel,
      icon: Wallet,
      tone: balanceToneClass,
    },
    {
      label: 'Entrou',
      value: receita,
      icon: TrendingUp,
      tone: 'text-concluido',
    },
    {
      label: 'Saiu',
      value: despesas,
      icon: TrendingDown,
      tone: 'text-urgente',
    },
    ...(saldoMes !== undefined
      ? [{
          label: 'Saldo mês',
          value: saldoMes,
          icon: Wallet,
          tone: saldoMes >= 0 ? 'text-concluido' : 'text-urgente',
        }]
      : []),
  ]

  return (
    <div className="space-y-2">
      {saldoDisponivel <= 0 && onConfigureSaldo && (
        <button
          type="button"
          onClick={onConfigureSaldo}
          className="w-full text-left rounded-sl border border-accent/35 bg-accent/10 px-3 py-2.5 min-h-[44px] hover:bg-accent/15 transition-colors"
        >
          <p className="text-[12px] font-medium text-ink">
            Cadastre o saldo da sua conta
          </p>
          <p className="text-[10px] text-ink-muted mt-0.5 font-mono uppercase">
            Finanças → Contas → Conta → Saldo inicial
          </p>
        </button>
      )}
      <div className={`grid grid-cols-2 ${items.length > 3 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-sl border border-line bg-card px-2.5 py-2"
        >
          <div className="flex items-center gap-1 mb-0.5">
            <Icon size={11} className={tone} />
            <span className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>{label}</span>
          </div>
          <p className={`${compact ? 'text-sm' : 'text-base'} font-display tabular-nums ${tone}`}>
            {fmt(value)}
          </p>
        </div>
      ))}
      </div>
    </div>
  )
}

import type { VirtualCard } from '../../store/storeTypes'
import type { BillingCycle } from '../../lib/financeCardCycle'
import { invoiceUsagePct } from '../../lib/financeCardCycle'
import { cardModalidadeLabel, cardTemCicloFatura, cardUsaExtrato } from '../../lib/financeCardModalidade'
import {
  CARD_USAGE_BAR_CLASS,
  CARD_USAGE_TEXT_CLASS,
  resolveCardUsageTone,
} from '../../lib/financeBalanceTone'
import { AXEL_PROGRESS_THICK } from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const SKINS: Record<VirtualCard['tipo_gradiente'], string> = {
  purple: 'from-violet-900/90 via-indigo-950 to-card',
  obsidian: 'from-zinc-800 via-zinc-950 to-card',
  sunset: 'from-rose-900/80 via-amber-950 to-card',
  ocean: 'from-sky-900/80 via-cyan-950 to-card',
  mint: 'from-emerald-900/80 via-teal-950 to-card',
}

interface CreditCardVisualProps
{
  card: VirtualCard
  cycle: BillingCycle
  invoiceTotal: number
  selected?: boolean
  onClick?: () => void
}

export function CreditCardVisual({
  card,
  cycle,
  invoiceTotal,
  selected = false,
  onClick,
}: CreditCardVisualProps)
{
  const usage = invoiceUsagePct(invoiceTotal, card.limite)
  const available = Math.max(0, card.limite - invoiceTotal)
  const usageTone = resolveCardUsageTone(usage)
  const barTone = CARD_USAGE_BAR_CLASS[usageTone]
  const pctTone = CARD_USAGE_TEXT_CLASS[usageTone]
  const temFatura = cardTemCicloFatura(card.modalidade)
  const usaExtrato = cardUsaExtrato(card.modalidade)
  const blocked = card.status === 'bloqueado'
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-sl border overflow-hidden transition-all ${
        selected ? 'border-accent ring-1 ring-accent/30' : 'border-line hover:border-accent/40'
      } ${blocked ? 'opacity-60' : ''}`}
    >
      <div className={`relative bg-gradient-to-br ${SKINS[card.tipo_gradiente]} p-4 min-h-[168px] flex flex-col justify-between`}>
        <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-sl" aria-hidden />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm text-white truncate">{card.nome}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider mt-0.5 text-white/60">
              {cardModalidadeLabel(card.modalidade)}
              {(card.modalidade ?? 'credito') === 'credito' || (card.modalidade ?? 'credito') === 'debito'
                ? ` · ${card.bandeira === 'visa' ? 'Visa' : 'Mastercard'}`
                : ''}
              {' · '}{card.titular}
            </p>
          </div>
          {blocked && (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sl border border-urgente/40 text-urgente bg-urgente/10">
              Bloqueado
            </span>
          )}
        </div>

        <div className="relative z-10">
          <p className="font-mono text-[13px] tracking-[0.18em] text-white/90">{card.numero}</p>
        </div>

        {/* Faixa de fatura no cartão */}
        <div className="relative z-10 space-y-1.5">
          <div className="flex justify-between items-end gap-2">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wide text-white/55">
                {temFatura ? 'Fatura aberta' : usaExtrato ? 'Extrato' : 'Usado'}
              </p>
              <p className="font-display text-lg tabular-nums text-white leading-none">{fmt(invoiceTotal)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[8px] uppercase text-white/55">Disponível</p>
              <p className={`font-mono text-[11px] tabular-nums ${available <= 0 ? 'text-urgente' : 'text-white'}`}>
                {fmt(available)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 font-mono text-[9px]">
            <span className="text-white/55">{usage.toFixed(0)}% usado</span>
            <span className={pctTone}>
              {usageTone === 'exhausted' ? 'Esgotado' : `${100 - Math.round(usage)}% livre`}
            </span>
          </div>

          <div className={`${AXEL_PROGRESS_THICK} bg-white/15`}>
            <div
              className={`h-full rounded-sl transition-all duration-300 ${barTone}`}
              style={{ width: `${Math.max(usage > 0 ? 2 : 0, usage)}%` }}
            />
          </div>

          {temFatura && (
            <div className="flex justify-between font-mono text-[9px] text-white/55">
              <span>Fecha {cycle.end.split('-').reverse().join('/')}</span>
              <span>Vence {cycle.dueDate.split('-').reverse().join('/')}</span>
            </div>
          )}
          {onClick && (
            <p className="font-mono text-[8px] uppercase text-white/70 text-center pt-0.5">
              {usaExtrato ? 'Toque para ver extrato' : 'Toque para ver fatura'}
            </p>
          )}
        </div>
      </div>
    </Tag>
  )
}

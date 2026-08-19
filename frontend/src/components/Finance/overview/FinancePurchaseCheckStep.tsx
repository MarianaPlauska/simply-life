import { Sparkles, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { PurchaseVerdict } from '../../../lib/financePurchaseCheck'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const TONE_ICON = {
  ok: CheckCircle2,
  caution: AlertTriangle,
  wait: XCircle,
} as const

const TONE_SHELL = {
  ok: 'border-l-concluido from-concluido/8',
  caution: 'border-l-atencao from-atencao/10',
  wait: 'border-l-urgente from-urgente/10',
} as const

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinancePurchaseCheckStepProps
{
  descricao: string
  valor: number
  verdict: PurchaseVerdict | null
  loading: boolean
  iaAtiva: boolean
  onConfirm: () => void
  onCancel: () => void
  onBack: () => void
  /** Esperar / cautela → cria tarefa no Kanban em vez de lançar */
  onDefer?: () => void
}

export function FinancePurchaseCheckStep({
  descricao,
  valor,
  verdict,
  loading,
  iaAtiva,
  onConfirm,
  onCancel,
  onBack,
  onDefer,
}: FinancePurchaseCheckStepProps)
{
  const Icon = verdict ? TONE_ICON[verdict.tone] : Sparkles
  const shell = verdict ? TONE_SHELL[verdict.tone] : 'border-l-accent from-accent/8'

  return (
    <div className="space-y-4">
      <div className={`rounded-sl border border-line border-l-[3px] bg-card overflow-hidden ${shell} bg-gradient-to-br to-transparent`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-sl border border-line bg-chrome/50 flex items-center justify-center">
              {loading ? (
                <Sparkles size={16} className="text-accent animate-pulse" />
              ) : (
                <Icon size={16} className="text-accent" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Axel · posso comprar?
                {iaAtiva && <span className="text-accent ml-1">· IA</span>}
              </p>
              <p className={`text-sm font-medium mt-1 ${AXEL_TEXT_PRIMARY}`}>
                {descricao} · {fmt(valor)}
              </p>
              {loading && (
                <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                  Analisando sua folga, categoria e compromissos…
                </p>
              )}
              {!loading && verdict && (
                <>
                  <p className={`text-base font-display mt-2 ${AXEL_TEXT_PRIMARY}`}>
                    {verdict.headline}
                  </p>
                  <p className={`text-[12px] mt-1.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                    {verdict.detail}
                  </p>
                  {verdict.diasSugeridos != null && verdict.tone === 'wait' && (
                    <p className="font-mono text-[10px] mt-2 text-atencao">
                      Sugestão: espere ~{verdict.diasSugeridos} dias
                    </p>
                  )}
                  {verdict.folgaAposCompra != null && (
                    <p className={`font-mono text-[10px] mt-2 tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                      Folga após compra: {fmt(verdict.folgaAposCompra)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {!loading && verdict && verdict.tone !== 'wait' && (
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-3 min-h-11 font-mono text-[11px] uppercase ${AXEL_BTN_PRIMARY}`}
          >
            {verdict.tone === 'caution' ? 'Comprar mesmo assim' : 'Confirmar compra'}
          </button>
        )}
        {!loading && verdict && (verdict.tone === 'wait' || verdict.tone === 'caution') && onDefer && (
          <button
            type="button"
            onClick={onDefer}
            className={`w-full py-2.5 min-h-11 font-mono text-[11px] uppercase ${
              verdict.tone === 'wait' ? AXEL_BTN_PRIMARY : 'rounded-sl border border-line text-ink hover:bg-chrome'
            }`}
          >
            {verdict.tone === 'wait' ? 'Criar tarefa e esperar' : 'Esperar, criar tarefa'}
          </button>
        )}
        {!loading && verdict?.tone === 'wait' && (
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 min-h-11 font-mono text-[11px] uppercase rounded-sl border border-urgente/40 text-urgente hover:bg-urgente/10"
          >
            Registrar mesmo assim
          </button>
        )}
        {!loading && verdict?.tone === 'wait' && !onDefer && (
          <button
            type="button"
            onClick={onCancel}
            className={`w-full py-3 min-h-11 font-mono text-[11px] uppercase ${AXEL_BTN_PRIMARY}`}
          >
            Desistir. Boa escolha
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full py-2.5 min-h-11 font-mono text-[10px] uppercase text-ink-muted hover:text-ink disabled:opacity-40"
        >
          Voltar ao formulário
        </button>
      </div>
    </div>
  )
}

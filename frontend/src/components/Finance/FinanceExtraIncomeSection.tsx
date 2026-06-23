import { useMemo, useState } from 'react'
import { Clock, Zap, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  computeOvertimePay,
  computeOvertimeRates,
  sumOvertimeInMonth,
  type OvertimeKind,
} from '../../lib/financeOvertimeCalc'
import { loadIncomeProfile, saveIncomeProfile } from '../../lib/financeIncomeProfile'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export type ReceitaEntradaKind = 'normal' | 'hora-extra' | 'freelance' | 'outro'
export type ReceitaCreditoQuando = 'agora' | 'proximo-mes'

export interface ReceitaEntradaPatch
{
  descricao?: string
  valor?: string
  data?: string
  creditoQuando?: ReceitaCreditoQuando
}

interface FinanceExtraIncomeSectionProps
{
  onPatch: (patch: ReceitaEntradaPatch) => void
}

function resolveCreditDate(when: ReceitaCreditoQuando): string
{
  if (when === 'agora')
  {
    return new Date().toISOString().slice(0, 10)
  }

  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10)
}

// Seção de renda extra — usada no drawer Novo lançamento (aba Receita)

export function FinanceExtraIncomeSection({ onPatch }: FinanceExtraIncomeSectionProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)

  const now = new Date()
  const viewYear = now.getFullYear()
  const viewMonth = now.getMonth()

  const recurringSalary = recurringIncomes.find((r) =>
    r.ativa && /sal[aá]rio|clt/i.test(r.titulo),
  )?.valor

  const storedProfile = loadIncomeProfile()
  const initialSalary = storedProfile?.salarioBruto ?? recurringSalary ?? 2500

  const [kind, setKind] = useState<ReceitaEntradaKind>('normal')
  const [salarioBruto, setSalarioBruto] = useState(String(initialSalary))
  const [creditoQuando, setCreditoQuando] = useState<ReceitaCreditoQuando>('agora')
  const [otHours, setOtHours] = useState('')
  const [otMinutes, setOtMinutes] = useState('')
  const [otKind, setOtKind] = useState<OvertimeKind>('weekday')

  const gross = parseFloat(salarioBruto.replace(',', '.')) || 0
  const rates = useMemo(() => computeOvertimeRates(gross), [gross])

  const heJaLancadasMes = useMemo(
    () => sumOvertimeInMonth(transactions, viewYear, viewMonth),
    [transactions, viewYear, viewMonth],
  )

  const receitasMes = useMemo(() =>
  {
    return transactions
      .filter((t) =>
      {
        if (t.tipo !== 'receita') return false
        const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth
      })
      .reduce((s, t) => s + t.valor, 0)
  }, [transactions, viewYear, viewMonth])

  const overtimePreview = useMemo(() =>
  {
    if (kind !== 'hora-extra' || gross <= 0) return null
    const h = parseInt(otHours, 10) || 0
    const m = parseInt(otMinutes, 10) || 0
    if (h === 0 && m === 0) return null
    return computeOvertimePay(gross, { hours: h, minutes: m, kind: otKind })
  }, [kind, gross, otHours, otMinutes, otKind])

  const projecaoComEste = heJaLancadasMes + (overtimePreview?.total ?? 0)
  const projecaoMesTotal = receitasMes + (overtimePreview?.total ?? 0)

  const overtimeDescription = (preview: NonNullable<typeof overtimePreview>) =>
    `Hora extra CLT · ${preview.decimalHours}h · ${preview.label}`

  const syncOvertimeToForm = (preview: NonNullable<typeof overtimePreview>) =>
  {
    onPatch({
      descricao: overtimeDescription(preview),
      valor: preview.total.toFixed(2).replace('.', ','),
      data: resolveCreditDate(creditoQuando),
      creditoQuando,
    })
  }

  const patchOvertimeIfReady = (hours: string, minutes: string, ot: OvertimeKind) =>
  {
    if (kind !== 'hora-extra' || gross <= 0) return
    const h = parseInt(hours, 10) || 0
    const m = parseInt(minutes, 10) || 0
    if (h === 0 && m === 0) return
    const preview = computeOvertimePay(gross, { hours: h, minutes: m, kind: ot })
    syncOvertimeToForm(preview)
  }

  const applyKind = (next: ReceitaEntradaKind) =>
  {
    setKind(next)
    if (next === 'normal')
    {
      onPatch({ descricao: '', valor: '' })
      return
    }

    const labels: Record<Exclude<ReceitaEntradaKind, 'normal' | 'hora-extra'>, string> = {
      freelance: '[extra:freelance] Freelance',
      outro: '[extra:outro] Renda extra',
    }

    if (next === 'hora-extra')
    {
      onPatch({
        descricao: '',
        valor: '',
        data: resolveCreditDate(creditoQuando),
        creditoQuando,
      })
      return
    }

    onPatch({ descricao: labels[next], valor: '' })
  }

  const applyOvertime = () =>
  {
    if (!overtimePreview) return
    onPatch({
      descricao: overtimeDescription(overtimePreview),
      valor: overtimePreview.total.toFixed(2).replace('.', ','),
      data: resolveCreditDate(creditoQuando),
      creditoQuando,
    })
    toast.success(
      `${fmt(overtimePreview.total)} no valor — salve o lançamento abaixo`,
      {
        description: creditoQuando === 'proximo-mes'
          ? 'Agendado para o dia 1º do próximo mês.'
          : 'Entra no caixa deste mês.',
      },
    )
  }

  const applyCreditoQuando = (when: ReceitaCreditoQuando) =>
  {
    setCreditoQuando(when)
    onPatch({ data: resolveCreditDate(when), creditoQuando: when })
  }

  const kinds: { id: ReceitaEntradaKind; label: string; hint: string; icon: typeof Clock }[] = [
    { id: 'normal', label: 'Valor livre', hint: 'PIX, salário, qualquer valor', icon: Wallet },
    { id: 'hora-extra', label: 'Hora extra CLT', hint: 'Calcula com salário ÷ 220', icon: Clock },
    { id: 'freelance', label: 'Freelance', hint: 'Trabalho avulso', icon: Zap },
    { id: 'outro', label: 'Outro extra', hint: 'Venda, reembolso…', icon: Wallet },
  ]

  return (
    <div className="rounded-sl border border-concluido/30 bg-concluido/5 p-3 space-y-3">
      <div>
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          Tipo de entrada
        </p>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
          Escolha como você ganhou — hora extra calcula sozinha.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {kinds.map(({ id, label, hint, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => applyKind(id)}
            className={`text-left rounded-sl border p-2.5 transition-colors ${
              kind === id
                ? 'border-concluido/50 bg-concluido/10'
                : 'border-line bg-card hover:bg-chrome'
            }`}
          >
            <Icon size={14} className={kind === id ? 'text-concluido' : 'text-ink-muted'} />
            <p className={`text-[11px] font-medium mt-1 ${AXEL_TEXT_PRIMARY}`}>{label}</p>
            <p className={`text-[9px] mt-0.5 leading-snug ${AXEL_TEXT_SECONDARY}`}>{hint}</p>
          </button>
        ))}
      </div>

      {kind === 'hora-extra' && (
        <div className="space-y-3 pt-2 border-t border-line/60">
          <div className="space-y-1.5">
            <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Salário bruto (base 220h)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={salarioBruto}
                onChange={(e) => setSalarioBruto(e.target.value)}
                className="flex-1 bg-chrome border border-line rounded-sl px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() =>
                {
                  if (gross > 0)
                  {
                    saveIncomeProfile(gross)
                  }
                }}
                className="px-3 py-2 rounded-sl border border-line font-mono text-[10px] uppercase font-medium text-ink bg-card shadow-sm hover:bg-chrome hover:border-ink/15 transition-colors shrink-0"
              >
                Salvar
              </button>
            </div>
            {gross > 0 && (
              <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                Hora {fmt(rates.hourlyNormal)} · +50% {fmt(rates.hourlyWeekdayExtra)} · +100% {fmt(rates.hourlySundayExtra)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>Horas</label>
              <input
                type="number"
                min={0}
                value={otHours}
                onChange={(e) =>
                {
                  setOtHours(e.target.value)
                  patchOvertimeIfReady(e.target.value, otMinutes, otKind)
                }}
                placeholder="0"
                className="w-full mt-1 bg-chrome border border-line rounded-sl px-2 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>Minutos</label>
              <input
                type="number"
                min={0}
                max={59}
                value={otMinutes}
                onChange={(e) =>
                {
                  setOtMinutes(e.target.value)
                  patchOvertimeIfReady(otHours, e.target.value, otKind)
                }}
                placeholder="0"
                className="w-full mt-1 bg-chrome border border-line rounded-sl px-2 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-1.5">
            {([
              { id: 'weekday' as const, label: 'Dia útil +50%' },
              { id: 'sunday' as const, label: 'Dom/Feriado +100%' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                {
                  setOtKind(id)
                  patchOvertimeIfReady(otHours, otMinutes, id)
                }}
                className={`flex-1 px-2 py-1.5 rounded-sl font-mono text-[9px] uppercase ${
                  otKind === id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {overtimePreview && (
            <div className="rounded-sl border border-concluido/30 bg-concluido/8 p-3 space-y-2">
              <p className={`text-sm ${AXEL_TEXT_PRIMARY}`}>
                <strong>Este lançamento:</strong>{' '}
                {overtimePreview.decimalHours}h × {fmt(overtimePreview.rate)} ={' '}
                <strong className="text-concluido">{fmt(overtimePreview.total)}</strong>
              </p>
              <div className={`text-[11px] font-mono space-y-1 ${AXEL_TEXT_SECONDARY}`}>
                <p>HE já no mês: {fmt(heJaLancadasMes)}</p>
                <p>HE acumulada + este: {fmt(projecaoComEste)}</p>
                <p className="text-concluido font-medium pt-1 border-t border-line/50">
                  Entradas do mês + este = {fmt(projecaoMesTotal)}
                </p>
              </div>
              <p className={`text-[10px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                Fórmula CLT: salário ÷ 220 = hora normal · dia útil × 1,5 · domingo × 2.
                Salve cada plantão separado — o total do mês soma automaticamente.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={applyOvertime}
            disabled={!overtimePreview}
            className="w-full py-2 rounded-sl bg-concluido/90 hover:bg-concluido text-white font-mono text-[10px] uppercase disabled:opacity-40"
          >
            Confirmar valor e preencher lançamento
          </button>
        </div>
      )}

      {kind !== 'normal' && kind !== 'hora-extra' && (
        <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
          Preencha descrição e valor abaixo — já marcamos como renda extra.
        </p>
      )}

      {kind !== 'normal' && (
        <div className="space-y-1.5 pt-2 border-t border-line/60">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Quando creditar</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => applyCreditoQuando('agora')}
              className={`py-2 rounded-sl font-mono text-[10px] uppercase ${
                creditoQuando === 'agora' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => applyCreditoQuando('proximo-mes')}
              className={`py-2 rounded-sl font-mono text-[10px] uppercase ${
                creditoQuando === 'proximo-mes' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              Próximo mês
            </button>
          </div>
          <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
            {creditoQuando === 'agora'
              ? 'Entra no caixa agora (status pago).'
              : 'Agendado para o dia 1º do próximo mês.'}
          </p>
        </div>
      )}
    </div>
  )
}

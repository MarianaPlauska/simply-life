import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  estimateMonthlySavings,
  projectFinancialGoal,
} from '../../lib/financeGoalProjection'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { MoneyInput } from '../ui/MoneyInput'
import { CategoryIconCircle } from './categories/CategoryIconCircle'
import type { FinancialGoal } from '../../store/storeTypes'

interface FinanceGoalWizardProps
{
  isOpen: boolean
  onClose: () => void
}

const STEPS = ['Tipo', 'Valor', 'Prazo', 'Confirmar'] as const

const CORES = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

const GOAL_PRESETS = [
  { id: 'viagem', label: 'Viagem', icone: 'Plane', cor: '#3b82f6', titulo: 'Viagem' },
  { id: 'reserva', label: 'Reserva', icone: 'PiggyBank', cor: '#10b981', titulo: 'Reserva de emergência' },
  { id: 'equipamento', label: 'Equipamento', icone: 'Smartphone', cor: '#f59e0b', titulo: 'Novo equipamento' },
  { id: 'outro', label: 'Outro', icone: 'Target', cor: '#8b5cf6', titulo: '' },
] as const

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const WIZARD_CARD =
  'w-full max-w-md flex flex-col max-h-[min(36rem,calc(100dvh-2rem))] rounded-sl border border-line bg-card shadow-lg overflow-hidden'

/** Wizard guiado para criar meta financeira */
export function FinanceGoalWizard({ isOpen, onClose }: FinanceGoalWizardProps)
{
  const addGoal = useTaskStore((s) => s.addGoal)
  const transactions = useTaskStore((s) => s.transactions)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)

  const [step, setStep] = useState(0)
  const [presetId, setPresetId] = useState<string>('viagem')
  const [titulo, setTitulo] = useState('Viagem')
  const [valorAlvo, setValorAlvo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [icone, setIcone] = useState('Plane')
  const [cor, setCor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    if (!isOpen) return
    setStep(0)
    setPresetId('viagem')
    setTitulo('Viagem')
    setValorAlvo('')
    setPrazo('')
    setIcone('Plane')
    setCor('#3b82f6')
    setSaving(false)
  }, [isOpen])

  const monthlySavings = useMemo(
    () => estimateMonthlySavings(transactions, recurringIncomes, contasFixas),
    [transactions, recurringIncomes, contasFixas],
  )

  const previewGoal = useMemo((): FinancialGoal => ({
    id: 0,
    titulo: titulo.trim() || 'Nova meta',
    valor_alvo: parseMoneyInputToNumber(valorAlvo) || 0,
    valor_atual: 0,
    prazo: prazo || undefined,
    icone,
    cor,
    concluida: false,
  }), [titulo, valorAlvo, prazo, icone, cor])

  const projection = useMemo(
    () => projectFinancialGoal(previewGoal, monthlySavings),
    [previewGoal, monthlySavings],
  )

  if (!isOpen) return null

  const selectPreset = (id: string) =>
  {
    const preset = GOAL_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(id)
    setIcone(preset.icone)
    setCor(preset.cor)
    if (preset.titulo)
    {
      setTitulo(preset.titulo)
    }
  }

  const canNext = (): boolean =>
  {
    if (step === 0) return titulo.trim().length > 0
    if (step === 1) return parseMoneyInputToNumber(valorAlvo) > 0
    return true
  }

  const handleSubmit = async () =>
  {
    const alvo = parseMoneyInputToNumber(valorAlvo)
    if (!titulo.trim() || alvo <= 0 || saving) return

    setSaving(true)
    try
    {
      await addGoal({
        titulo: titulo.trim(),
        valor_alvo: alvo,
        valor_atual: 0,
        prazo: prazo || undefined,
        icone,
        cor,
        concluida: false,
      })
      toast.success('Meta criada!')
      onClose()
    }
    catch
    {
      toast.error('Não foi possível criar a meta.')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        className={WIZARD_CARD}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-wizard-title"
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 id="goal-wizard-title" className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>
              Nova meta
            </h3>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Passo {step + 1} de {STEPS.length} · {STEPS[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome rounded-sl min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3" aria-hidden>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${idx <= step ? 'bg-finance' : 'bg-chrome'}`}
            />
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {step === 0 && (
            <>
              <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                Escolha um tipo para começar — você pode ajustar o nome depois.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-sl border min-h-11 transition-colors ${
                      presetId === preset.id
                        ? 'border-finance/50 bg-finance/10'
                        : 'border-line hover:bg-chrome'
                    }`}
                  >
                    <CategoryIconCircle icone={preset.icone} cor={preset.cor} size="md" />
                    <span className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
              <div>
                <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                  Nome da meta
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Viagem Japão"
                  className="w-full bg-chrome border border-line rounded-sl px-4 py-2.5 text-[13px] text-ink outline-none focus:border-accent/50"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                Quanto você quer juntar para &ldquo;{titulo.trim() || 'esta meta'}&rdquo;?
              </p>
              <div>
                <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                  Valor alvo (R$)
                </label>
                <MoneyInput
                  value={valorAlvo}
                  onChange={setValorAlvo}
                  className="w-full text-[15px]"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                Prazo opcional — usamos sua sobra mensal para estimar se cabe.
              </p>
              <div>
                <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                  Prazo (opcional)
                </label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full bg-chrome border border-line rounded-sl px-4 py-2.5 text-[13px] text-ink font-mono outline-none focus:border-accent/50"
                />
              </div>
              <div className="rounded-sl border border-line bg-chrome/40 px-3 py-3 space-y-1">
                <p className={`text-[11px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}>
                  Projeção AXEL
                </p>
                <p className={`text-[13px] leading-relaxed ${projection.onTrack ? 'text-concluido' : 'text-atencao'}`}>
                  {projection.paceMessage}
                </p>
                {monthlySavings > 0 && (
                  <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                    Sobra estimada: {fmt(monthlySavings)}/mês
                  </p>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                Confira antes de criar.
              </p>
              <div className="rounded-sl border border-line p-4 flex items-start gap-3">
                <CategoryIconCircle icone={icone} cor={cor} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                    {titulo.trim()}
                  </p>
                  <p className="text-[18px] font-display tabular-nums text-finance mt-1">
                    {fmt(parseMoneyInputToNumber(valorAlvo))}
                  </p>
                  {prazo && (
                    <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
                      Prazo: {new Date(`${prazo}T12:00:00`).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                    {projection.paceMessage}
                  </p>
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {CORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCor(c)}
                      className={`w-8 h-8 rounded-full border-2 min-h-11 min-w-11 ${
                        cor === c ? 'border-accent' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 px-5 py-4 border-t border-line">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-sl text-[13px] text-ink-muted hover:text-ink min-h-11"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <span />
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className={`inline-flex items-center gap-1 px-4 py-2.5 rounded-sl text-[13px] font-medium disabled:opacity-40 min-h-11 ${AXEL_BTN_PRIMARY}`}
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext() || saving}
              onClick={() => void handleSubmit()}
              className={`inline-flex items-center gap-1 px-4 py-2.5 rounded-sl text-[13px] font-medium disabled:opacity-40 min-h-11 ${AXEL_BTN_PRIMARY}`}
            >
              <Check className="w-4 h-4" />
              Criar meta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

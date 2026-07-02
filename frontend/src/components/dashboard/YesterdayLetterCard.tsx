import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { buildYesterdayLetter } from '../../lib/yesterdayLetter'
import {
  loadYesterdayLetterReply,
  saveYesterdayLetterReply,
} from '../../lib/yesterdayLetterReply'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const DISMISS_KEY = 'axel-yesterday-letter-dismiss'

function todayDismissKey(): string
{
  return `${DISMISS_KEY}-${new Date().toISOString().slice(0, 10)}`
}

export function YesterdayLetterCard()
{
  const navigate = useNavigate()
  const humorSemana = useTaskStore((s) => s.humorSemana)
  const humorMes = useTaskStore((s) => s.humorMes)
  const entradasRecentes = useTaskStore((s) => s.entradasRecentes)
  const anotacoes = useTaskStore((s) => s.anotacoes)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)
  const fetchHumorMes = useTaskStore((s) => s.fetchHumorMes)
  const fetchAnotacoes = useTaskStore((s) => s.fetchAnotacoes)
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario)
  const mood = useMoodOrchestration()

  const [dismissed, setDismissed] = useState(() =>
  {
    try
    {
      return localStorage.getItem(todayDismissKey()) === '1'
    }
    catch
    {
      return false
    }
  })

  const [reply, setReply] = useState(() => loadYesterdayLetterReply()?.text ?? '')
  const [savingReply, setSavingReply] = useState(false)

  useEffect(() =>
  {
    void fetchEntradasRecentes?.(14)
    void fetchHumorMes?.()
    void fetchAnotacoes?.()
  }, [fetchEntradasRecentes, fetchHumorMes, fetchAnotacoes])

  const letter = useMemo(
    () => buildYesterdayLetter({
      humorSemana,
      humorMes,
      entradasRecentes,
      anotacoes,
      mood,
    }),
    [humorSemana, humorMes, entradasRecentes, anotacoes, mood],
  )

  if (!letter.visible || dismissed)
  {
    return null
  }

  const dismiss = () =>
  {
    setDismissed(true)
    try
    {
      localStorage.setItem(todayDismissKey(), '1')
    }
    catch { /* ignore */ }
  }

  const acceptLightDay = () =>
  {
    dismiss()
    navigate('/kanban')
  }

  const persistReply = async () =>
  {
    const text = reply.trim()
    if (!text)
    {
      toast.message('Escreva algo para o eu de ontem')
      return
    }

    setSavingReply(true)
    try
    {
      saveYesterdayLetterReply(text)
      await criarEntradaDiario?.(
        text,
        'Resposta ao eu de ontem',
        'carta_ontem',
      )
      toast.success('Resposta guardada no diário de hoje')
    }
    catch
    {
      toast.error('Não foi possível salvar')
    }
    finally
    {
      setSavingReply(false)
    }
  }

  return (
    <section
      className={`${AXEL_BORDERLESS_PANEL} p-2.5 sm:p-3 border-l-4 border-l-accent bg-accent/5`}
      aria-label="Carta do eu de ontem"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
          <p className="font-mono text-[9px] uppercase tracking-wide text-accent">
            Carta do eu de ontem
            {letter.noteSource && (
              <span className={`ml-1 ${AXEL_TEXT_SECONDARY}`}>
                · {letter.noteSource === 'diario' ? 'diário' : letter.noteSource === 'anotacao' ? 'nota' : 'humor'}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome transition-colors shrink-0"
          aria-label="Fechar carta"
        >
          <X size={13} />
        </button>
      </div>

      <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
        {letter.axelMessage}
      </p>

      <div className="mt-2.5 space-y-1.5">
        <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          O que você diria ao eu de ontem?
        </label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Ex: Hoje vou com calma. Ontem foi pesado, mas eu sobrevivi."
          className="w-full border border-line rounded-sl bg-chrome/60 px-3 py-2 text-[12px] text-ink placeholder:text-ink-muted outline-none focus:border-accent/50 resize-none min-h-[72px]"
        />
        <button
          type="button"
          disabled={savingReply || !reply.trim()}
          onClick={() => void persistReply()}
          className={`w-full py-2 font-mono text-[9px] uppercase rounded-sl border border-line text-ink-muted hover:border-accent/40 hover:text-accent disabled:opacity-40`}
        >
          {savingReply ? 'Salvando…' : 'Guardar resposta no diário'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        <button
          type="button"
          onClick={acceptLightDay}
          className={`inline-flex items-center px-2.5 py-1.5 font-mono text-[9px] uppercase ${AXEL_BTN_PRIMARY}`}
        >
          {letter.ctaLabel}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="px-2.5 py-1.5 font-mono text-[9px] uppercase text-ink-muted border border-line rounded-sl hover:bg-chrome"
        >
          Hoje quero mais
        </button>
      </div>
    </section>
  )
}

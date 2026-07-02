import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, X } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { buildYesterdayLetter } from '../../lib/yesterdayLetter'
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
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)
  const fetchHumorMes = useTaskStore((s) => s.fetchHumorMes)
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

  useEffect(() =>
  {
    void fetchEntradasRecentes?.(14)
    void fetchHumorMes?.()
  }, [fetchEntradasRecentes, fetchHumorMes])

  const letter = useMemo(
    () => buildYesterdayLetter({
      humorSemana,
      humorMes,
      entradasRecentes,
      mood,
    }),
    [humorSemana, humorMes, entradasRecentes, mood],
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

  return (
    <section
      className={`${AXEL_BORDERLESS_PANEL} border-l-4 border-l-accent bg-accent/5`}
      aria-label="Carta do eu de ontem"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-4 h-4 text-accent shrink-0" />
          <p className="font-mono text-[9px] uppercase tracking-wide text-accent">
            Carta do eu de ontem
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome transition-colors shrink-0"
          aria-label="Fechar carta"
        >
          <X size={14} />
        </button>
      </div>

      <p className={`text-[14px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
        {letter.axelMessage}
      </p>

      {letter.noteSnippet && (
        <blockquote className={`mt-2 pl-3 border-l-2 border-line text-[12px] italic ${AXEL_TEXT_SECONDARY}`}>
          {letter.noteSnippet}
        </blockquote>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={acceptLightDay}
          className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
        >
          {letter.ctaLabel}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="px-3 py-2 font-mono text-[10px] uppercase text-ink-muted hover:text-ink border border-line rounded-sl"
        >
          Hoje quero mais
        </button>
      </div>
    </section>
  )
}

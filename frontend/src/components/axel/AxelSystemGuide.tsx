import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { AXEL_SYSTEM_GUIDE } from '../../lib/axelSystemGuideContent'

interface AxelSystemGuideProps
{
  compact?: boolean
  wizard?: boolean
  onWizardComplete?: () => void
}

export function AxelSystemGuide({
  compact = false,
  wizard = false,
  onWizardComplete,
}: AxelSystemGuideProps)
{
  const [step, setStep] = useState(0)
  const total = AXEL_SYSTEM_GUIDE.length
  const current = AXEL_SYSTEM_GUIDE[step]
  const isLast = step >= total - 1

  const sections = wizard ? [current] : AXEL_SYSTEM_GUIDE

  const goNext = () =>
  {
    if (isLast)
    {
      onWizardComplete?.()
      return
    }
    setStep((s) => Math.min(s + 1, total - 1))
  }

  const goPrev = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <section
      className={[
        wizard ? 'border-0 bg-transparent p-0 space-y-2 sm:space-y-3' : 'sl-panel',
        !wizard && (compact ? 'p-3' : 'p-4 sm:p-5'),
        wizard ? '' : 'space-y-3',
      ].join(' ')}
      aria-label="Como funciona o Simply-Life"
    >
      <div className={`flex items-center justify-between gap-2 ${wizard ? 'justify-center sm:justify-between' : ''}`}>
        <div className={`flex items-center gap-2 min-w-0 ${wizard ? 'justify-center sm:justify-start' : ''}`}>
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" strokeWidth={1.75} />
          <h2 className={`font-display text-ink truncate ${wizard ? 'text-sm sm:text-base' : 'text-base'}`}>
            Como o sistema funciona
          </h2>
        </div>
        {wizard && (
          <span className="font-mono text-[9px] sm:text-[10px] text-ink-muted tabular-nums shrink-0">
            {step + 1}/{total}
          </span>
        )}
      </div>

      {!compact && !wizard && (
        <p className="text-[12px] text-ink-muted leading-relaxed">
          Resumo do Kanban, score, foco e notificações. Reler em Preferências → Geral.
        </p>
      )}

      {wizard && (
        <div className="h-1 rounded-full bg-chrome overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      )}

      <div className={`space-y-2 ${wizard ? 'sm:space-y-2.5' : 'space-y-2.5'}`}>
        {sections.map((s) => (
          <div
            key={s.id}
            className={`rounded-sl border border-line/80 bg-chrome/15 px-2.5 py-2 sm:px-3 sm:py-2.5 ${wizard ? 'text-center sm:text-left' : ''}`}
          >
            <h3 className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wide text-accent mb-1">{s.title}</h3>
            <p className="text-[11px] sm:text-[12px] text-ink-muted leading-relaxed">{s.body}</p>
            {s.bullets && s.bullets.length > 0 && (
              <ul className={`mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[11px] sm:text-[12px] text-ink-muted leading-relaxed ${wizard ? 'list-none sm:list-disc list-inside' : 'list-disc list-inside'}`}>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {wizard && (
        <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-sl border border-line text-[10px] sm:text-[11px] font-mono uppercase tracking-wide text-ink-muted hover:text-ink hover:bg-chrome disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} />
            <span className="sr-only sm:not-sr-only sm:inline">Anterior</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 sm:py-2.5 rounded-sl bg-accent text-white font-mono text-[10px] sm:text-[11px] uppercase tracking-wide"
          >
            {isLast ? 'Começar' : 'Próximo'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      )}
    </section>
  )
}

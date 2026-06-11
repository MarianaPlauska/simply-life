import { Brain, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { AXEL_PLACEMENT_RULES } from '../../lib/orchestratePipeline'
import type { IntelligenceMode } from '../../lib/orchestrateApi'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface KanbanOrchestrationStatusProps
{
  autoEnabled: boolean
  orchestrating: boolean
  lastRunAt: Date | null
  lastSource: 'ai' | 'mock' | null
  intelligenceReady: IntelligenceMode
  manualCount: number
  onToggleAuto: (enabled: boolean) => void
  onReorganizeAll: () => void
}

function formatRelativeTime(date: Date): string
{
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'agora'
  if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function KanbanOrchestrationStatus({
  autoEnabled,
  orchestrating,
  lastRunAt,
  lastSource,
  intelligenceReady,
  manualCount,
  onToggleAuto,
  onReorganizeAll,
}: KanbanOrchestrationStatusProps)
{
  const [rulesOpen, setRulesOpen] = useState(false)

  const intelligenceLabel =
    lastSource === 'ai'
      ? 'Última análise: IA AXEL'
      : intelligenceReady === 'ai_ready'
        ? 'IA disponível · última rodada local'
        : intelligenceReady === 'local'
          ? 'Motor local (sem chave IA no servidor)'
          : 'Verificando inteligência…'

  return (
    <section className="border border-line rounded-sl bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-accent">
            {orchestrating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Brain className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            {orchestrating ? 'Organizando…' : 'AXEL organiza'}
          </span>

          {lastRunAt && !orchestrating && (
            <span className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
              {formatRelativeTime(lastRunAt)}
            </span>
          )}

          <span className={`font-mono text-[10px] ${lastSource === 'ai' ? 'text-accent' : AXEL_TEXT_SECONDARY}`}>
            {intelligenceLabel}
          </span>

          {manualCount > 0 && (
            <span className="font-mono text-[10px] text-atencao">
              {manualCount} ajuste{manualCount > 1 ? 's' : ''} manual
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoEnabled}
              onChange={(e) => onToggleAuto(e.target.checked)}
              className="rounded-sl border-line accent-accent w-3.5 h-3.5"
            />
            <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Auto
            </span>
          </label>

          <button
            type="button"
            onClick={onReorganizeAll}
            disabled={orchestrating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
            Reorganizar tudo
          </button>

          <button
            type="button"
            onClick={() => setRulesOpen((o) => !o)}
            className="inline-flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted hover:text-ink transition-colors"
            aria-expanded={rulesOpen}
          >
            Regras
            {rulesOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {rulesOpen && (
        <div className="border-t border-line px-4 py-3 bg-chrome/30 space-y-3">
          <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            A IA lê título, descrição, remetente, tags e prazo. Para começar com{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Groq (grátis)
            </a>
            , crie uma chave e defina <code className="font-mono text-[11px]">GROQ_API_KEY</code> no Vercel
            ou em <code className="font-mono text-[11px]">.env.local</code> na raiz +{' '}
            <code className="font-mono text-[11px]">npm run dev</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AXEL_PLACEMENT_RULES.map((r) => (
            <div key={r.id}>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
                {r.label}
              </p>
              <p className={`text-[12px] mt-0.5 leading-snug ${AXEL_TEXT_SECONDARY}`}>
                {r.rule}
              </p>
            </div>
          ))}
          </div>
        </div>
      )}
    </section>
  )
}

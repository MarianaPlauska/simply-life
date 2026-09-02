import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, Sparkles, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import { useAxelAsk } from '../../hooks/useAxelAsk'
import { useTaskStore } from '../../store/useTaskStore'
import { AxelDumpProposals } from './AxelDumpProposals'
import {
  AXEL_ASK_EXAMPLES,
  AXEL_ASK_UNLOCK_LEVEL,
  type VerdictTone,
} from '../../lib/axelTodayVerdict'
import {
  AXEL_GLASS_CHROME,
  AXEL_TOUCH_PRESS,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface AxelAskDrawerProps
{
  open: boolean
  onClose: () => void
}

interface ChatLine
{
  id: string
  role: 'user' | 'axel'
  text: string
}

function toneClass(tone: VerdictTone): string
{
  if (tone === 'ok') return 'text-concluido'
  if (tone === 'wait') return 'text-urgente'
  return 'text-atencao'
}

export function AxelAskDrawer({ open, onClose }: AxelAskDrawerProps)
{
  const navigate = useNavigate()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<ChatLine[]>([])
  const lastUserQuestion = [...lines].reverse().find((l) => l.role === 'user')?.text ?? ''

  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const { ask, loading, lastVerdict, unlocked, level, reset, iaAtiva } = useAxelAsk()

  const initials = iniciaisDe(
    workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || '',
  )

  useEffect(() =>
  {
    if (open)
    {
      reset()
      setLines([])
      setInput('')
      window.setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, reset])

  const handleAsk = async (text?: string) =>
  {
    const q = (text ?? input).trim()
    if (!q || loading) return

    if (!unlocked)
    {
      toast.message(`AXEL Consulta desbloqueia no nível ${AXEL_ASK_UNLOCK_LEVEL}`)
      return
    }

    setLines((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: q }])
    setInput('')

    const verdict = await ask(q)
    if (!verdict) return

    const axelText = `${verdict.headline}\n\n${verdict.summary}`
    setLines((prev) => [...prev, { id: `a-${Date.now()}`, role: 'axel', text: axelText }])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-stretch justify-center sm:justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar consulta AXEL"
        onClick={onClose}
      />

      <aside
        className={`relative w-full sm:w-[min(420px,100vw)] max-h-[92dvh] sm:max-h-none sm:h-full flex flex-col border-t sm:border-t-0 sm:border-l border-line shadow-2xl ${AXEL_GLASS_CHROME} sl-glass-chrome rounded-t-sl-lg sm:rounded-none`}
        role="dialog"
        aria-label="Consulta AXEL"
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b border-line shrink-0">
          <AxelCompanionAvatar
            style={workspacePrefs.avatar_style}
            initials={initials}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent flex items-center gap-1">
              <Sparkles size={10} />
              Consulta AXEL
              {iaAtiva && <span className="text-accent/80">· IA</span>}
            </p>
            <h2 className={`text-sm font-display ${AXEL_TEXT_PRIMARY}`}>
              Posso fazer isso hoje?
            </h2>
            {!unlocked && (
              <p className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                <Lock size={10} />
                Nv {AXEL_ASK_UNLOCK_LEVEL} para veredito completo · você está no {level}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome ${AXEL_TOUCH_PRESS}`}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-3 min-h-0">
          {lines.length === 0 && (
            <div className="rounded-sl border border-line bg-chrome/40 p-3 space-y-2">
              <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                Pergunte como se fosse para um amigo. Ex.: &quot;Posso comprar tênis de R$ 350?&quot; O AXEL olha humor, tarefas e caixa antes de responder.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AXEL_ASK_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => void handleAsk(ex)}
                    className={`px-2 py-1 rounded-sl border border-line text-[10px] font-mono text-left hover:bg-chrome disabled:opacity-50 ${AXEL_TOUCH_PRESS}`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {lines.map((line) => (
            <div
              key={line.id}
              className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-sl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                  line.role === 'user'
                    ? 'bg-accent/15 text-ink border border-accent/25'
                    : 'bg-card border border-line text-ink'
                }`}
              >
                {line.text}
              </div>
            </div>
          ))}

          {lastVerdict && (
            <div className="rounded-sl border border-line bg-card p-3 space-y-2">
              <p className={`font-display text-sm ${toneClass(lastVerdict.tone)}`}>
                {lastVerdict.headline}
              </p>
              <ul className="space-y-2">
                {lastVerdict.bullets.map((b) => (
                  <li key={b.axis} className="text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono uppercase text-[9px] text-ink-muted">{b.label}</span>
                      <span className="font-mono tabular-nums text-[9px] text-accent">{b.pct}%</span>
                    </div>
                    <p className="text-ink-muted mt-0.5">{b.detail}</p>
                    <div className="h-1 rounded-sl bg-chrome mt-1 overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${b.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {lastVerdict.suggestedAction && (
                <p className="text-[11px] text-ink-muted border-t border-line pt-2">
                  → {lastVerdict.suggestedAction}
                </p>
              )}
              <p className="font-mono text-[8px] text-ink-muted/80">
                Regras: {lastVerdict.rulesApplied.join(' · ')}
              </p>
            </div>
          )}

          {lastUserQuestion && (
            <AxelDumpProposals question={lastUserQuestion} />
          )}
        </div>

        <footer className="shrink-0 border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] space-y-2">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
              {
                if (e.key === 'Enter' && !e.shiftKey)
                {
                  e.preventDefault()
                  void handleAsk()
                }
              }}
              rows={2}
              placeholder={unlocked ? 'Ex.: marcar dentista quinta?' : `Suba para Nv ${AXEL_ASK_UNLOCK_LEVEL}…`}
              disabled={!unlocked || loading}
              className="flex-1 resize-none rounded-sl border border-line bg-chrome px-3 py-2 text-[13px] text-ink placeholder:text-ink-muted disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!unlocked || loading || !input.trim()}
              onClick={() => void handleAsk()}
              className={`shrink-0 self-end p-2.5 rounded-sl bg-ink text-fundo disabled:opacity-40 ${AXEL_TOUCH_PRESS}`}
              aria-label="Enviar pergunta"
            >
              <Send size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/kanban') }}
            className={`w-full text-center font-mono text-[9px] uppercase text-ink-muted hover:text-accent ${AXEL_TOUCH_PRESS}`}
          >
            Ver log de decisões no Kanban
          </button>
        </footer>
      </aside>
    </div>
  )
}

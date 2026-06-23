import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp, FolderOpen, Tag, X } from 'lucide-react'
import { fetchUserContextos, type ContextoRow } from '../../lib/taskContextService'
import { useTaskStore } from '../../store/useTaskStore'
import { useMobileSnapSheet } from '../../hooks/useMobileSnapSheet'
import type { Label } from '../../types'

// Pastas e flags cadastradas — visão geral

interface AxelGruposSheetProps
{
  open: boolean
  onClose: () => void
}

export function AxelGruposSheet({ open, onClose }: AxelGruposSheetProps)
{
  const labels = useTaskStore((s) => s.labels)
  const fetchLabels = useTaskStore((s) => s.fetchLabels)
  const [contextos, setContextos] = useState<ContextoRow[]>([])
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false,
  )

  const {
    snap,
    sheetStyle,
    expand,
    collapse,
    handleProps,
  } = useMobileSnapSheet({ open, onClose, enabled: isMobile })

  useEffect(() =>
  {
    const mq = window.matchMedia('(max-width: 639px)')
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() =>
  {
    if (!open) return
    void fetchLabels()
    void fetchUserContextos().then(setContextos)
  }, [open, fetchLabels])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Grupos e marcadores"
    >
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />
      <div
        className="relative w-full sm:max-w-md flex flex-col overflow-hidden rounded-t-sl sm:rounded-sl border border-line bg-card shadow-xl sm:max-h-[85dvh] mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:mb-0"
        style={isMobile ? sheetStyle : undefined}
      >
        <div
          className="shrink-0 flex flex-col items-center pt-2 pb-1 sm:hidden touch-none cursor-grab active:cursor-grabbing"
          {...handleProps}
          onDoubleClick={expand}
          aria-hidden={!isMobile}
        >
          <div className="w-10 h-1 rounded-full bg-line mb-2" />
          <button
            type="button"
            onClick={() => (snap === 'expanded' ? collapse() : expand())}
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-ink-muted px-3 py-1"
            aria-label={snap === 'expanded' ? 'Recolher painel' : 'Expandir painel'}
          >
            <ChevronUp
              size={12}
              className={`transition-transform ${snap === 'expanded' ? 'rotate-180' : ''}`}
            />
            {snap === 'expanded' ? 'Arraste para recolher' : 'Arraste para ver tudo'}
          </button>
        </div>

        <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
          <h2 className="font-sans text-sm font-semibold text-ink">Grupos e marcadores</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-sl text-ink-muted hover:text-ink min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 pb-6 space-y-5">
          <section>
            <div className="flex items-center gap-1.5 mb-2 text-ink-muted">
              <FolderOpen size={14} aria-hidden />
              <h3 className="font-mono text-[10px] uppercase tracking-wider">Pastas</h3>
              {contextos.length > 0 && (
                <span className="ml-auto font-mono text-[9px] tabular-nums text-zinc-500">{contextos.length}</span>
              )}
            </div>
            {contextos.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhuma pasta ainda. Crie ao editar uma tarefa em Organização.</p>
            ) : (
              <ul className="space-y-1.5">
                {contextos.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-sl border border-line bg-chrome/20"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} aria-hidden />
                    <span className="font-sans text-ink">{c.titulo}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <div className="flex items-center gap-1.5 mb-2 text-ink-muted">
              <Tag size={14} aria-hidden />
              <h3 className="font-mono text-[10px] uppercase tracking-wider">Flags</h3>
              {labels.length > 0 && (
                <span className="ml-auto font-mono text-[9px] tabular-nums text-zinc-500">{labels.length}</span>
              )}
            </div>
            {labels.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhuma flag. Adicione no drawer da tarefa.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l: Label) => (
                  <span
                    key={l.id}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-sl border"
                    style={{ borderColor: l.cor, color: l.cor }}
                  >
                    {l.nome}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}

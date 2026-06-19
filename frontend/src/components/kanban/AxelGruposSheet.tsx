import { useEffect, useState } from 'react'
import { FolderOpen, Tag, X } from 'lucide-react'
import { fetchUserContextos, type ContextoRow } from '../../lib/taskContextService'
import { useTaskStore } from '../../store/useTaskStore'
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

  useEffect(() =>
  {
    if (!open) return
    void fetchLabels()
    void fetchUserContextos().then(setContextos)
  }, [open, fetchLabels])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Grupos e marcadores">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full sm:max-w-md max-h-[85dvh] overflow-hidden rounded-t-sl sm:rounded-sl border border-line bg-card shadow-xl flex flex-col">
        <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink">Grupos e marcadores</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-sl text-ink-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
          <section>
            <div className="flex items-center gap-1.5 mb-2 text-ink-muted">
              <FolderOpen size={14} aria-hidden />
              <h3 className="font-mono text-[10px] uppercase tracking-wider">Pastas</h3>
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
                    <span className="font-mono text-ink">{c.titulo}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <div className="flex items-center gap-1.5 mb-2 text-ink-muted">
              <Tag size={14} aria-hidden />
              <h3 className="font-mono text-[10px] uppercase tracking-wider">Flags</h3>
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
    </div>
  )
}

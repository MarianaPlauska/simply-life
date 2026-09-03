import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  createContexto,
  fetchUserContextos,
  type ContextoRow,
} from '../../lib/taskContextService'
import { DRAWER_FLAG_COLORS } from './AxelDrawerOrganizationSection'

// Select de pastas - expande para baixo com cores e criação inline

interface ContextoComboboxProps
{
  value: string
  color: string
  onValueChange: (titulo: string) => void
  onColorChange: (cor: string) => void
  onSelect: (ctx: ContextoRow | null) => void
  disabled?: boolean
}

export function ContextoCombobox({
  value,
  color,
  onValueChange,
  onColorChange,
  onSelect,
  disabled = false,
}: ContextoComboboxProps)
{
  const [contextos, setContextos] = useState<ContextoRow[]>([])
  const [open, setOpen] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    void fetchUserContextos().then(setContextos)
  }, [])

  useEffect(() =>
  {
    function handleClickOutside(e: MouseEvent)
    {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
      {
        setOpen(false)
        setCreateMode(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = useMemo(
    () => contextos.find((c) => c.titulo.toLowerCase() === value.trim().toLowerCase()) ?? null,
    [contextos, value],
  )

  const pick = (ctx: ContextoRow) =>
  {
    onValueChange(ctx.titulo)
    onColorChange(ctx.cor)
    onSelect(ctx)
    setOpen(false)
    setCreateMode(false)
  }

  const handleCreate = async () =>
  {
    const nome = value.trim()
    if (!nome)
    {
      toast.message('Digite o nome da pasta')
      return
    }
    const existing = contextos.find((c) => c.titulo.toLowerCase() === nome.toLowerCase())
    if (existing)
    {
      pick(existing)
      return
    }
    const created = await createContexto(nome, color)
    if (!created)
    {
      toast.error('Não foi possível criar a pasta')
      return
    }
    setContextos((prev) => [...prev, created].sort((a, b) => a.titulo.localeCompare(b.titulo)))
    pick(created)
    toast.success(`Pasta «${nome}» criada`)
  }

  const triggerLabel = selected?.titulo ?? value.trim() ?? 'Escolher pasta…'
  const triggerColor = selected?.cor ?? color

  return (
    <div ref={wrapRef} className="min-w-0 relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 min-w-0 text-sm border border-line rounded-sl px-2.5 py-2 text-left bg-chrome/20 hover:bg-chrome/40 transition-colors disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: triggerColor }}
          aria-hidden
        />
        <span className={`flex-1 min-w-0 truncate ${value.trim() || selected ? 'text-ink' : 'text-ink-muted'}`}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute z-30 left-0 right-0 top-full mt-1 rounded-sl border border-line bg-card shadow-lg overflow-hidden"
          role="listbox"
        >
          {contextos.length > 0 ? (
            <ul className="max-h-44 overflow-y-auto custom-scrollbar py-1">
              {contextos.map((c) =>
              {
                const active = selected?.id === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-2.5 py-2 text-sm flex items-center gap-2 hover:bg-chrome transition-colors ${
                        active ? 'bg-accent-muted/40 text-accent' : 'text-ink'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(c)}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-line/50"
                        style={{ backgroundColor: c.cor }}
                        aria-hidden
                      />
                      <span className="truncate">{c.titulo}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-2.5 py-2 text-[11px] text-ink-muted">Nenhuma pasta ainda.</p>
          )}

          <div className="border-t border-line p-2 space-y-2 bg-chrome/15">
            <button
              type="button"
              onClick={() => setCreateMode((v) => !v)}
              className="w-full text-left text-[10px] font-mono uppercase text-ink-muted hover:text-accent"
            >
              {createMode ? 'Cancelar nova pasta' : '+ Nova pasta'}
            </button>

            {createMode && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {DRAWER_FLAG_COLORS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      disabled={disabled}
                      onClick={() => onColorChange(cor)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        color === cor ? 'border-ink scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: cor }}
                      aria-label={`Cor da pasta ${cor}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2 min-w-0">
                  <input
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onValueChange(e.target.value)}
                    placeholder="Nome da pasta…"
                    className="flex-1 min-w-0 text-sm border border-line rounded-sl px-2.5 py-1.5 text-ink bg-transparent outline-none focus:border-accent/40"
                    aria-label="Nome da nova pasta"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleCreate()}
                    className="shrink-0 px-2.5 py-1.5 text-xs font-mono uppercase border border-line rounded-sl text-ink-muted hover:text-accent"
                    title="Criar pasta"
                    aria-label="Criar pasta"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

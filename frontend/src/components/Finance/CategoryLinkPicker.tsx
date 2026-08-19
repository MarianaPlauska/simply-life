import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { Category } from '../../store/storeTypes'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface CategoryLinkPickerProps
{
  categories: Category[]
  value: string
  onChange: (id: string) => void
  emptyLabel?: string
}

export function CategoryLinkPicker({
  categories,
  value,
  onChange,
  emptyLabel = 'Sem vínculo',
}: CategoryLinkPickerProps)
{
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = categories.find((c) => String(c.id) === value)

  const filtered = useMemo(() =>
  {
    const q = query.trim().toLowerCase()
    const sorted = [...categories].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    if (!q) return sorted
    return sorted.filter((c) => c.nome.toLowerCase().includes(q))
  }, [categories, query])

  useEffect(() =>
  {
    function handleClickOutside(e: MouseEvent)
    {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
      {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = open ? query : (selected?.nome ?? '')

  const pick = (id: string) =>
  {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-stretch border border-line rounded-sl bg-chrome overflow-hidden min-h-[44px]">
        <span className="flex items-center pl-2.5 text-ink-muted shrink-0" aria-hidden>
          <Search size={14} />
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={(e) =>
          {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? selected.nome : `Buscar — ${emptyLabel.toLowerCase()}`}
          className="flex-1 min-w-0 px-2 py-2.5 text-sm text-ink bg-transparent placeholder:text-ink-muted"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-2.5 border-l border-line text-ink-muted hover:text-ink hover:bg-chrome/80 shrink-0 min-w-[44px]"
          aria-label={open ? 'Fechar lista' : 'Abrir lista'}
          aria-expanded={open}
        >
          <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      {open && (
        <ul
          className="absolute z-30 mt-1 w-full max-h-[min(220px,40dvh)] overflow-y-auto custom-scrollbar rounded-sl border border-line bg-card shadow-lg py-1"
          role="listbox"
        >
          <li>
            <button
              type="button"
              onClick={() => pick('')}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-chrome/80 min-h-[44px] ${
                value === '' ? 'text-accent font-medium' : 'text-ink-muted'
              }`}
            >
              {emptyLabel}
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className={`px-3 py-2 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Nenhuma categoria encontrada
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(String(c.id))}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-chrome/80 min-h-[44px] truncate ${
                    value === String(c.id) ? 'text-accent font-medium' : 'text-ink'
                  }`}
                >
                  {c.nome}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

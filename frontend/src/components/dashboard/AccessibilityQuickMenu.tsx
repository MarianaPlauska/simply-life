import { useEffect, useRef, useState } from 'react'
import { Accessibility, Minus, Plus, Sun, Moon } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_HEADER_ACTION, AXEL_LINE } from '../../constants/axelSurfaces'

// Acessibilidade — alternância claro/escuro + ajustes finos

interface ToggleRowProps
{
  label: string
  active: boolean
  onChange: () => void
}

function ToggleRow({ label, active, onChange }: ToggleRowProps)
{
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-colors"
    >
      <span>{label}</span>
      <span
        className={`relative w-9 h-5 rounded-full transition-colors ${
          active ? 'bg-indigo-600' : 'bg-zinc-400 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            active ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function AccessibilityQuickMenu()
{
  const accessibility = useTaskStore((s) => s.accessibility)
  const setAccessibility = useTaskStore((s) => s.setAccessibility)
  const toggleColorScheme = useTaskStore((s) => s.toggleColorScheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isDark = accessibility.colorScheme === 'dark'
  const ThemeIcon = isDark ? Sun : Moon
  const themeLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro'

  useEffect(() =>
  {
    if (!open) return
    const onClick = (e: MouseEvent) =>
    {
      if (ref.current && !ref.current.contains(e.target as Node))
      {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleColorScheme}
        className={AXEL_HEADER_ACTION}
        aria-label={themeLabel}
        title={themeLabel}
      >
        <ThemeIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={AXEL_HEADER_ACTION}
        aria-label="Mais opções de acessibilidade"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Accessibility className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Configurações de acessibilidade"
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-400/20 overflow-hidden dark:border-zinc-800/80 dark:bg-[#121214] dark:shadow-black/40"
        >
          <div className="px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Acessibilidade
            </p>
          </div>
          <div className={AXEL_LINE} />

          <button
            type="button"
            onClick={() =>
            {
              toggleColorScheme()
            }}
            className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.03]"
          >
            <span>Tema {isDark ? 'escuro' : 'claro'}</span>
            <ThemeIcon className="w-4 h-4 text-zinc-500" />
          </button>

          <div className={AXEL_LINE} />

          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <span className="text-[13px] text-zinc-700 dark:text-zinc-300">Tamanho da fonte</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAccessibility('fontSize', Math.max(12, accessibility.fontSize - 1))}
                className={AXEL_HEADER_ACTION}
                aria-label="Diminuir fonte"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] font-mono tabular-nums text-zinc-500 w-8 text-center">
                {accessibility.fontSize}
              </span>
              <button
                type="button"
                onClick={() => setAccessibility('fontSize', Math.min(22, accessibility.fontSize + 1))}
                className={AXEL_HEADER_ACTION}
                aria-label="Aumentar fonte"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={AXEL_LINE} />

          <ToggleRow
            label="Alto contraste"
            active={accessibility.highContrast}
            onChange={() => setAccessibility('highContrast', !accessibility.highContrast)}
          />
          <ToggleRow
            label="Reduzir animações"
            active={accessibility.reducedMotion}
            onChange={() => setAccessibility('reducedMotion', !accessibility.reducedMotion)}
          />
        </div>
      )}
    </div>
  )
}

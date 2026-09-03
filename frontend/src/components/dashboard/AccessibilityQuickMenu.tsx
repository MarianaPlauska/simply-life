import { useEffect, useRef, useState } from 'react'
import { Accessibility, Minus, Plus, Sun, Moon } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { COLOR_SCHEME_OPTIONS } from '../../utils/applyColorScheme'
import type { ColorScheme } from '../../store/storeTypes'
import {
  AXEL_HEADER_ACTION,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface ToggleRowProps
{
  label: string
  description?: string
  active: boolean
  onChange: () => void
}

function ToggleRow({ label, description, active, onChange }: ToggleRowProps)
{
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-chrome/60 transition-colors"
    >
      <div className="min-w-0">
        <span className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>{label}</span>
        {description && (
          <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{description}</p>
        )}
      </div>
      <span
        className={`relative w-9 h-5 rounded-sl shrink-0 transition-colors ${
          active ? 'bg-accent' : 'bg-chrome border border-line'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-sl bg-card border border-line transition-transform ${
            active ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

const SCHEME_ICON: Record<ColorScheme, typeof Sun> = {
  light: Sun,
  dark: Moon,
}

interface AccessibilityPanelProps
{
  variant?: 'menu' | 'page'
}

export function AccessibilityPanel({ variant = 'menu' }: AccessibilityPanelProps)
{
  const accessibility = useTaskStore((s) => s.accessibility)
  const setAccessibility = useTaskStore((s) => s.setAccessibility)

  const isPage = variant === 'page'

  return (
    <div className={isPage ? 'space-y-4' : ''}>
      <div className={isPage ? 'sl-panel overflow-hidden' : ''}>
        {!isPage && (
          <div className="px-3 py-2 border-b border-line">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Aparência
            </p>
          </div>
        )}
        <div className={isPage ? 'p-4 space-y-2' : 'p-1'}>
          {isPage && (
            <h3 className={`text-sm font-display ${AXEL_TEXT_PRIMARY}`}>Tema da interface</h3>
          )}
          <div className={`grid gap-1.5 ${isPage ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {COLOR_SCHEME_OPTIONS.map((opt) =>
            {
              const Icon = SCHEME_ICON[opt.id]
              const active = accessibility.colorScheme === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccessibility('colorScheme', opt.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sl border text-left transition-colors min-h-[44px] ${
                    active
                      ? 'border-accent/40 bg-accent-muted text-ink'
                      : 'border-line bg-card hover:bg-chrome text-ink-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <p className="text-[13px] font-medium">{opt.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={isPage ? 'sl-panel overflow-hidden' : ''}>
        {!isPage && (
          <div className="px-3 py-2 border-t border-line">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Leitura
            </p>
          </div>
        )}
        <div className={`flex items-center justify-between gap-3 px-3 py-3 ${isPage ? 'border-b border-line' : ''}`}>
          <span className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>Tamanho da fonte</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAccessibility('fontSize', Math.max(12, accessibility.fontSize - 1))}
              className={AXEL_HEADER_ACTION}
              aria-label="Diminuir fonte"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[13px] font-mono tabular-nums w-8 text-center ${AXEL_TEXT_SECONDARY}`}>
              {accessibility.fontSize}
            </span>
            <button
              type="button"
              onClick={() => setAccessibility('fontSize', Math.min(24, accessibility.fontSize + 1))}
              className={AXEL_HEADER_ACTION}
              aria-label="Aumentar fonte"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isPage && (
          <div className="px-4 py-3">
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={accessibility.fontSize}
              onChange={(e) => setAccessibility('fontSize', Number(e.target.value))}
              className="w-full accent-[var(--sl-accent)]"
              aria-label="Tamanho do texto base"
            />
          </div>
        )}
      </div>

      <div className={isPage ? 'sl-panel overflow-hidden divide-y divide-line' : 'border-t border-line'}>
        {!isPage && (
          <div className="px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Conforto
            </p>
          </div>
        )}
        <ToggleRow
          label="Alto contraste"
          description="Texto e bordas mais legíveis"
          active={accessibility.highContrast}
          onChange={() => setAccessibility('highContrast', !accessibility.highContrast)}
        />
        <ToggleRow
          label="Reduzir animações"
          description="Menos movimento na interface"
          active={accessibility.reducedMotion}
          onChange={() => setAccessibility('reducedMotion', !accessibility.reducedMotion)}
        />
        {isPage && (
          <>
            <ToggleRow
              label="Foco visível"
              description="Indicador maior ao navegar por teclado"
              active={accessibility.focusVisible}
              onChange={() => setAccessibility('focusVisible', !accessibility.focusVisible)}
            />
            <ToggleRow
              label="Sons de feedback"
              description="Áudio ao concluir ações"
              active={accessibility.soundFeedback}
              onChange={() => setAccessibility('soundFeedback', !accessibility.soundFeedback)}
            />
          </>
        )}
      </div>
    </div>
  )
}

export function AccessibilityQuickMenu()
{
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={AXEL_HEADER_ACTION}
        aria-label="Aparência e acessibilidade"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Aparência e acessibilidade"
      >
        <Accessibility className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Aparência e acessibilidade"
          className="fixed z-[200] right-3 top-[3.75rem] w-[min(calc(100vw-1.5rem),18rem)] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-sl border border-line bg-card shadow-lg overflow-hidden"
        >
          <AccessibilityPanel variant="menu" />
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { ML_MAX, ML_MIN, isBuiltInMlPreset, parseMlInput } from '../../lib/waterHydration'

interface MlChipRowProps
{
  presets: number[]
  selected: number
  onSelect: (ml: number) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

function MlChipRow({ presets, selected, onSelect, disabled, size = 'sm' }: MlChipRowProps)
{
  const pad = size === 'md'
    ? 'px-2.5 py-1 text-[10px] sm:px-2 sm:py-0.5 sm:text-[9px]'
    : 'px-2 py-0.5 text-[9px] sm:px-1.5 sm:py-px sm:text-[8px]'

  return (
    <div className="flex flex-wrap gap-1">
      {presets.map((ml) => (
        <button
          key={ml}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(ml)}
          className={`rounded-sl font-mono border transition-colors ${pad} ${
            selected === ml
              ? 'border-health/40 bg-health-muted text-ink'
              : 'border-line text-ink-muted hover:text-ink hover:bg-chrome/40'
          }`}
        >
          {ml}ml
        </button>
      ))}
    </div>
  )
}

interface MlCustomFieldProps
{
  value: string
  onChange: (value: string) => void
  onApply: () => void
  label?: string
  disabled?: boolean
}

function MlCustomField({ value, onChange, onApply, label = 'Outro valor', disabled }: MlCustomFieldProps)
{
  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-1.5">
      <label className="flex flex-col gap-1 min-w-[120px] flex-1 sm:min-w-[96px] sm:max-w-[8.5rem]">
        <span className="font-mono text-[9px] sm:text-[8px] uppercase text-ink-muted">{label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={ML_MIN}
            max={ML_MAX}
            step={10}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) =>
            {
              if (e.key === 'Enter')
              {
                e.preventDefault()
                onApply()
              }
            }}
            className="w-full bg-chrome border border-line rounded-sl px-2 py-1.5 sm:py-1 sm:px-1.5 text-ink text-[12px] sm:text-[11px] font-mono tabular-nums"
            placeholder={`${ML_MIN}–${ML_MAX}`}
          />
          <span className="font-mono text-[10px] sm:text-[9px] text-ink-muted shrink-0">ml</span>
        </div>
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onApply}
        className="shrink-0 px-3 py-1.5 sm:px-2 sm:py-1 rounded-sl border border-health/30 bg-health-muted font-mono text-[10px] sm:text-[9px] uppercase text-ink hover:bg-health-muted/80 transition-colors"
      >
        Aplicar
      </button>
    </div>
  )
}

interface WaterDefaultMlControlsProps
{
  defaultMl: number
  presets: number[]
  onDefaultChange: (ml: number) => void
  onAddPreset?: (ml: number) => void
  onRemovePreset?: (ml: number) => void
  disabled?: boolean
}

/** Padrão de ml + painel para gerenciar atalhos */
export function WaterDefaultMlControls({
  defaultMl,
  presets,
  onDefaultChange,
  onAddPreset,
  onRemovePreset,
  disabled = false,
}: WaterDefaultMlControlsProps)
{
  const [manageOpen, setManageOpen] = useState(false)
  const [draftDefault, setDraftDefault] = useState(String(defaultMl))
  const [newPreset, setNewPreset] = useState('')

  useEffect(() =>
  {
    setDraftDefault(String(defaultMl))
  }, [defaultMl])

  const applyDefault = () =>
  {
    const parsed = parseMlInput(draftDefault)
    if (parsed === null)
    {
      return
    }
    onDefaultChange(parsed)
    setDraftDefault(String(parsed))
  }

  const addPreset = () =>
  {
    const parsed = parseMlInput(newPreset)
    if (parsed === null || !onAddPreset)
    {
      return
    }
    onAddPreset(parsed)
    setNewPreset('')
  }

  const customPresets = presets.filter((ml) => !isBuiltInMlPreset(ml))

  const removePreset = (ml: number) =>
  {
    onRemovePreset?.(ml)
  }

  return (
    <div className="space-y-2 sm:space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-1">
        <span className="font-mono text-[9px] sm:text-[8px] uppercase text-ink-muted">Padrão</span>
        <MlChipRow
          presets={presets}
          selected={defaultMl}
          onSelect={onDefaultChange}
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setManageOpen((o) => !o)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-1.5 sm:py-px rounded-sl font-mono text-[9px] sm:text-[8px] border transition-colors ${
            manageOpen
              ? 'border-health/40 bg-health-muted text-ink'
              : 'border-line text-ink-muted hover:text-ink'
          }`}
          aria-expanded={manageOpen}
        >
          <Settings2 size={11} className="sm:w-[10px] sm:h-[10px]" strokeWidth={1.75} />
          Gerenciar
        </button>
      </div>

      {manageOpen && (
        <div className="rounded-sl border border-line bg-chrome/50 p-3 sm:p-2 space-y-3 sm:space-y-2 sm:max-w-md">
          <MlCustomField
            label="Ml padrão (novos copos)"
            value={draftDefault}
            onChange={setDraftDefault}
            onApply={applyDefault}
            disabled={disabled}
          />

          {onAddPreset && onRemovePreset && (
            <div className="space-y-2 pt-1 border-t border-line">
              <p className="font-mono text-[9px] uppercase text-ink-muted">Atalhos personalizados</p>
              {customPresets.length === 0 ? (
                <p className="text-[10px] text-ink-muted">Nenhum atalho extra. Adicione abaixo.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {customPresets.map((ml) => (
                    <span
                      key={ml}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-sl border border-line bg-card font-mono text-[9px] text-ink"
                    >
                      {ml}ml
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removePreset(ml)}
                        className="px-1 text-ink-muted hover:text-urgente"
                        aria-label={`Remover atalho ${ml} ml`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <MlCustomField
                label="Adicionar atalho"
                value={newPreset}
                onChange={setNewPreset}
                onApply={addPreset}
                disabled={disabled}
              />
              <p className="text-[10px] text-ink-muted leading-relaxed">
                Remover um atalho tira o botão rápido; você ainda pode digitar qualquer valor no campo acima.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface WaterEntryMlEditorProps
{
  index: number
  currentMl: number
  presets: number[]
  onApply: (ml: number) => void
  onRemove: () => void
  disabled?: boolean
}

/** Editor de um copo já registrado */
export function WaterEntryMlEditor({
  index,
  currentMl,
  presets,
  onApply,
  onRemove,
  disabled = false,
}: WaterEntryMlEditorProps)
{
  const [draft, setDraft] = useState(String(currentMl))

  useEffect(() =>
  {
    setDraft(String(currentMl))
  }, [currentMl])

  const applyCustom = () =>
  {
    const parsed = parseMlInput(draft)
    if (parsed === null)
    {
      return
    }
    onApply(parsed)
  }

  return (
    <div className="rounded-sl border border-line bg-chrome/60 p-3 sm:p-2 space-y-3 sm:space-y-2 sm:max-w-md">
      <p className="font-mono text-[9px] uppercase text-ink-muted">
        Copo {index + 1} · {currentMl} ml
      </p>
      <MlChipRow
        presets={presets}
        selected={currentMl}
        onSelect={onApply}
        disabled={disabled}
        size="md"
      />
      <MlCustomField
        label="Quantidade personalizada"
        value={draft}
        onChange={setDraft}
        onApply={applyCustom}
        disabled={disabled}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="text-[10px] font-mono uppercase text-urgente hover:underline"
      >
        Remover este copo
      </button>
    </div>
  )
}

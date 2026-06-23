import { useMemo, useState } from 'react'
import { Pill, Plus, Trash2, Sun, Sunset, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { horariosDoMedicamento } from '../../lib/medicamentosSchedule'
import {
  MED_CATEGORIAS,
  MED_PERIODOS,
  DIAS_SEMANA,
  DURACAO_PRESETS,
  fimTratamentoFromInicio,
  horariosFromPeriodos,
  labelDiasSemana,
} from '../../lib/medicamentosCatalog'
import type { MedicamentoCategoria, MedicamentoPeriodo } from '../../store/storeTypes'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface MedicamentosBulkPanelProps
{
  variant?: 'compact' | 'full' | 'cadastro'
  showAdvanced?: boolean
}

interface DraftMed
{
  nome: string
  dosagem: string
  categoria: MedicamentoCategoria
  usoDiario: boolean
  periodos: MedicamentoPeriodo[]
  horarios: Partial<Record<MedicamentoPeriodo, string>>
  diasSemana: number[]
  inicioTratamento: string
  duracaoDias: number | null
  fimTratamento: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const EMPTY_DRAFT = (): DraftMed => ({
  nome: '',
  dosagem: '',
  categoria: 'outro',
  usoDiario: true,
  periodos: ['manha'],
  horarios: {},
  diasSemana: [],
  inicioTratamento: todayIso(),
  duracaoDias: null,
  fimTratamento: '',
})

// Cadastro estruturado — períodos, dosagem e tipo para alertas do AXEL

export function MedicamentosBulkPanel({
  variant = 'full',
  showAdvanced = true,
}: MedicamentosBulkPanelProps)
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const addMedicamentosBulk = useTaskStore((s) => s.addMedicamentosBulk)
  const removeMedicamentosBulk = useTaskStore((s) => s.removeMedicamentosBulk)

  const [draft, setDraft] = useState<DraftMed>(EMPTY_DRAFT)
  const [queue, setQueue] = useState<DraftMed[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const compact = variant === 'compact'
  const cadastro = variant === 'cadastro'

  const PERIODO_ICON: Record<MedicamentoPeriodo, typeof Sun> = {
    manha: Sun,
    tarde: Sunset,
    noite: Moon,
  }

  const toggleDia = (id: number) =>
  {
    setDraft((prev) =>
    {
      const current = prev.diasSemana.length === 0
        ? DIAS_SEMANA.map((d) => d.id)
        : prev.diasSemana
      const has = current.includes(id)
      const next = has ? current.filter((d) => d !== id) : [...current, id]
      if (next.length === 7) return { ...prev, diasSemana: [] }
      return { ...prev, diasSemana: next }
    })
  }

  const setDuracao = (duracaoDias: number | null) =>
  {
    setDraft((prev) =>
    {
      const fimTratamento =
        duracaoDias && prev.inicioTratamento
          ? fimTratamentoFromInicio(prev.inicioTratamento, duracaoDias)
          : ''
      return { ...prev, duracaoDias, fimTratamento }
    })
  }

  const togglePeriodo = (p: MedicamentoPeriodo) =>
  {
    setDraft((prev) =>
    {
      const has = prev.periodos.includes(p)
      const periodos = has
        ? prev.periodos.filter((x) => x !== p)
        : [...prev.periodos, p]
      return { ...prev, periodos: periodos.length ? periodos : ['manha'] }
    })
  }

  const addToQueue = () =>
  {
    if (!draft.nome.trim())
    {
      toast.error('Informe o nome do medicamento')
      return
    }
    if (draft.periodos.length === 0)
    {
      toast.error('Escolha ao menos um período')
      return
    }
    setQueue((q) => [...q, { ...draft, nome: draft.nome.trim() }])
    setDraft(EMPTY_DRAFT())
  }

  const draftToItem = (item: DraftMed) =>
  {
    const horarios = horariosFromPeriodos(item.periodos, item.horarios)
    return {
      nome: item.dosagem ? `${item.nome} ${item.dosagem}` : item.nome,
      horario: horarios[0],
      horarios,
      config: {
        horarios,
        periodos: item.periodos,
        dosagem: item.dosagem || undefined,
        categoria: item.categoria,
        uso_diario: item.usoDiario,
        dias_semana: item.diasSemana.length ? item.diasSemana : undefined,
        inicio_tratamento: item.inicioTratamento || undefined,
        fim_tratamento: item.fimTratamento || undefined,
        duracao_dias: item.duracaoDias,
      },
    }
  }

  const handleSaveDraft = async () =>
  {
    if (!draft.nome.trim())
    {
      toast.error('Informe o nome do medicamento')
      return
    }
    if (draft.periodos.length === 0)
    {
      toast.error('Escolha ao menos um período')
      return
    }
    setSaving(true)
    try
    {
      const n = await addMedicamentosBulk([draftToItem({ ...draft, nome: draft.nome.trim() })])
      if (n > 0)
      {
        toast.success('Medicamento salvo — lembrete no horário configurado')
        setDraft(EMPTY_DRAFT())
      }
    }
    finally
    {
      setSaving(false)
    }
  }

  const queuePreview = useMemo(() =>
    queue.map((item) =>
    {
      const horarios = horariosFromPeriodos(item.periodos, item.horarios)
      const cat = MED_CATEGORIAS.find((c) => c.id === item.categoria)?.label ?? 'Outro'
      return { ...item, horarios, cat }
    }),
  [queue])

  const handleSaveAll = async () =>
  {
    const items = queuePreview.map((item) => draftToItem(item))

    if (items.length === 0)
    {
      toast.error('Adicione ao menos um medicamento à lista')
      return
    }

    setSaving(true)
    try
    {
      const n = await addMedicamentosBulk(items)
      toast.success(`${n} medicamento${n !== 1 ? 's' : ''} cadastrado${n !== 1 ? 's' : ''}`)
      setQueue([])
    }
    finally
    {
      setSaving(false)
    }
  }

  const toggleSelect = (id: number) =>
  {
    setSelected((prev) =>
    {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkRemove = async () =>
  {
    if (selected.size === 0) return
    if (!window.confirm(`Remover ${selected.size} medicamento(s)?`)) return
    setSaving(true)
    try
    {
      await removeMedicamentosBulk([...selected])
      setSelected(new Set())
      toast.success('Lista atualizada')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className={`space-y-3 ${compact || cadastro ? '' : 'mt-4'}`}>
      <div className="sl-panel p-3 sm:p-4 space-y-3">
        {!cadastro && (
          <>
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-accent shrink-0" />
              <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                Cadastrar medicamentos
              </p>
            </div>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Uso diário com horários por período — o AXEL aprende e lembra na hora certa.
            </p>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nome (ex.: Losartana)"
            value={draft.nome}
            onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
            className="bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink min-h-[44px]"
          />
          <input
            type="text"
            placeholder="Dosagem (ex.: 50mg)"
            value={draft.dosagem}
            onChange={(e) => setDraft((d) => ({ ...d, dosagem: e.target.value }))}
            className="bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink min-h-[44px]"
          />
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-1.5">Períodos do dia</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MED_PERIODOS) as MedicamentoPeriodo[]).map((p) =>
            {
              const Icon = PERIODO_ICON[p]
              const on = draft.periodos.includes(p)
              const meta = MED_PERIODOS[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePeriodo(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl border text-[11px] transition-colors min-h-[40px] ${
                    on
                      ? 'border-accent/40 bg-accent-muted text-ink'
                      : 'border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon size={12} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {draft.periodos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {draft.periodos.map((p) =>
            {
              const meta = MED_PERIODOS[p]
              return (
                <label key={p} className="block">
                  <span className="font-mono text-[9px] uppercase text-ink-muted">
                    Horário · {meta.label}
                  </span>
                  <input
                    type="time"
                    value={draft.horarios[p] ?? meta.defaultTime}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        horarios: { ...d.horarios, [p]: e.target.value },
                      }))
                    }
                    className="mt-1 w-full bg-chrome border border-line rounded-sl px-2 py-1.5 text-[13px] text-ink min-h-[40px]"
                  />
                </label>
              )
            })}
          </div>
        )}

        {showAdvanced && (
          <>
        <div>
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-1.5">Tipo</p>
          <div className="flex flex-wrap gap-1.5">
            {MED_CATEGORIAS.map((cat) =>
            {
              const on = draft.categoria === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  title={cat.hint}
                  onClick={() => setDraft((d) => ({ ...d, categoria: cat.id }))}
                  className={`px-2 py-1 rounded-sl font-mono text-[9px] uppercase border transition-colors ${
                    on
                      ? 'border-accent/50 bg-accent-muted text-accent'
                      : 'border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[12px] text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={draft.usoDiario}
            onChange={(e) => setDraft((d) => ({ ...d, usoDiario: e.target.checked }))}
            className="rounded-sl border-line accent-[var(--sl-accent)]"
          />
          Uso diário — alertas automáticos
        </label>

        <div>
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-1.5">Dias da semana</p>
          <div className="flex flex-wrap gap-1">
            {DIAS_SEMANA.map((dia) =>
            {
              const todos = draft.diasSemana.length === 0
              const on = todos || draft.diasSemana.includes(dia.id)
              return (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => toggleDia(dia.id)}
                  className={`min-w-[40px] px-2 py-1.5 rounded-sl font-mono text-[9px] uppercase border transition-colors ${
                    on
                      ? 'border-accent/40 bg-accent-muted text-ink'
                      : 'border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  {dia.short}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">
            {labelDiasSemana(draft.diasSemana)}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-0 flex-1">
            <span className="font-mono text-[9px] uppercase text-ink-muted">Início</span>
            <input
              type="date"
              value={draft.inicioTratamento}
              onChange={(e) =>
              {
                const inicioTratamento = e.target.value
                setDraft((d) =>
                {
                  const fimTratamento =
                    d.duracaoDias
                      ? fimTratamentoFromInicio(inicioTratamento, d.duracaoDias)
                      : d.fimTratamento
                  return { ...d, inicioTratamento, fimTratamento }
                })
              }}
              className="mt-0.5 w-full bg-chrome border border-line rounded-sl px-2 py-1 text-[12px] text-ink min-h-[36px]"
            />
          </label>
          <label className="block min-w-0 flex-1">
            <span className="font-mono text-[9px] uppercase text-ink-muted">Fim</span>
            <input
              type="date"
              value={draft.fimTratamento}
              disabled={draft.duracaoDias !== null}
              onChange={(e) => setDraft((d) => ({ ...d, fimTratamento: e.target.value, duracaoDias: null }))}
              className="mt-0.5 w-full bg-chrome border border-line rounded-sl px-2 py-1 text-[12px] text-ink min-h-[36px] disabled:opacity-50"
            />
          </label>
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-1.5">Duração</p>
          <div className="flex flex-wrap gap-1.5">
            {DURACAO_PRESETS.map((preset) =>
            {
              const on = draft.duracaoDias === preset.id
              return (
                <button
                  key={String(preset.id)}
                  type="button"
                  onClick={() => setDuracao(preset.id)}
                  className={`px-2 py-1 rounded-sl font-mono text-[9px] uppercase border transition-colors ${
                    on
                      ? 'border-accent/50 bg-accent-muted text-accent'
                      : 'border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
          </>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void (cadastro ? handleSaveDraft() : addToQueue())}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sl border border-line text-ink font-mono text-[10px] uppercase min-h-[44px] hover:bg-chrome disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {cadastro ? 'Salvar medicamento' : 'Adicionar à lista'}
        </button>
      </div>

      {queuePreview.length > 0 && (
        <div className="sl-panel overflow-hidden">
          <header className="px-3 py-2 border-b border-line">
            <p className="font-mono text-[9px] uppercase text-ink-muted">
              {queuePreview.length} na fila
            </p>
          </header>
          <ul className="divide-y divide-line">
            {queuePreview.map((item, idx) => (
              <li key={idx} className="px-3 py-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>{item.nome}</p>
                  <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                    {item.cat} · {item.horarios.join(' · ')}
                    {item.usoDiario ? ' · diário' : ''}
                    {' · '}{labelDiasSemana(item.diasSemana)}
                    {item.duracaoDias
                      ? ` · ${item.duracaoDias}d`
                      : item.fimTratamento
                        ? ` · até ${item.fimTratamento}`
                        : ' · contínuo'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQueue((q) => q.filter((_, i) => i !== idx))}
                  className="text-ink-muted hover:text-urgente p-1"
                  aria-label="Remover da lista"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="p-3 border-t border-line">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveAll()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sl bg-accent text-white font-mono text-[10px] uppercase min-h-[44px] disabled:opacity-50"
            >
              Salvar {queuePreview.length} medicamento{queuePreview.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {medicamentos.length > 0 && !cadastro && (
        <div className="sl-panel overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-line">
            <p className={`text-[11px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}>
              Cadastrados ({medicamentos.length})
            </p>
            <button
              type="button"
              disabled={saving || selected.size === 0}
              onClick={() => void handleBulkRemove()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-urgente/30 text-urgente text-[11px] font-mono uppercase disabled:opacity-40 min-h-[36px]"
            >
              <Trash2 className="w-3 h-3" />
              Excluir ({selected.size})
            </button>
          </header>
          <ul className="divide-y divide-line max-h-48 overflow-y-auto">
            {medicamentos.map((med) =>
            {
              const checked = selected.has(med.id)
              const cat = med.config?.categoria
                ? MED_CATEGORIAS.find((c) => c.id === med.config?.categoria)?.label
                : null
              return (
                <li key={med.id}>
                  <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-chrome/40 min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(med.id)}
                      className="rounded-sl border-line accent-[var(--sl-accent)] w-4 h-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] truncate ${AXEL_TEXT_PRIMARY}`}>{med.nome}</p>
                      <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                        {[
                          cat,
                          horariosDoMedicamento(med).join(' · '),
                          labelDiasSemana(med.config?.dias_semana),
                          med.config?.duracao_dias
                            ? `${med.config.duracao_dias}d`
                            : med.config?.fim_tratamento
                              ? `até ${med.config.fim_tratamento}`
                              : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Pill } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { horariosDoMedicamento } from '../../../lib/medicamentosSchedule'
import { MED_CATEGORIAS, labelDiasSemana } from '../../../lib/medicamentosCatalog'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { EmptyState } from '../../ui/EmptyState'

interface MedicamentosGerenciarTabProps
{
  onGoCadastrar: () => void
}

export function MedicamentosGerenciarTab({ onGoCadastrar }: MedicamentosGerenciarTabProps)
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const removeMedicamento = useTaskStore((s) => s.removeMedicamento)
  const removeMedicamentosBulk = useTaskStore((s) => s.removeMedicamentosBulk)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggleSelect = (id: number) =>
  {
    setSelected((prev) =>
    {
      const next = new Set(prev)
      if (next.has(id))
      {
        next.delete(id)
      }
      else
      {
        next.add(id)
      }
      return next
    })
  }

  const handleRemoveOne = async (id: number, nome: string) =>
  {
    if (!window.confirm(`Remover "${nome}"?`))
    {
      return
    }
    await removeMedicamento(id)
    toast.success('Medicamento removido')
  }

  const handleBulkRemove = async () =>
  {
    if (selected.size === 0)
    {
      return
    }
    if (!window.confirm(`Remover ${selected.size} medicamento(s)?`))
    {
      return
    }
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

  if (medicamentos.length === 0)
  {
    return (
      <EmptyState
        icon={Pill}
        title="Nada cadastrado"
        description="Adicione medicamentos na aba Cadastrar."
        actionLabel="Cadastrar"
        onAction={onGoCadastrar}
        tone="accent"
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
          {medicamentos.length} medicamento{medicamentos.length !== 1 ? 's' : ''}
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
      </div>

      <ul className="rounded-sl border border-line bg-card divide-y divide-line overflow-hidden">
        {medicamentos.map((med) =>
        {
          const checked = selected.has(med.id)
          const cat = med.config?.categoria
            ? MED_CATEGORIAS.find((c) => c.id === med.config?.categoria)?.label
            : null
          return (
            <li key={med.id} className="px-4 py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelect(med.id)}
                className="mt-1 rounded-sl border-line accent-[var(--sl-accent)] w-4 h-4 shrink-0"
                aria-label={`Selecionar ${med.nome}`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>{med.nome}</p>
                <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                  {[
                    cat,
                    horariosDoMedicamento(med).join(' · '),
                    labelDiasSemana(med.config?.dias_semana),
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemoveOne(med.id, med.nome)}
                className="p-1.5 rounded-sl text-ink-muted hover:text-urgente hover:bg-urgente/10 shrink-0"
                aria-label={`Remover ${med.nome}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Pill, Plus, Clock, X, Check, History, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { EmptyState } from '../ui/EmptyState'
import {
  buildDosesHoje,
  horariosDoMedicamento,
  medicamentoCompletoHoje,
  mensagemGentilDose,
  proximaDosePendente,
} from '../../lib/medicamentosSchedule'
import { MedicamentosBulkPanel } from './MedicamentosBulkPanel'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Medicamentos — horários, lembrete gentil do AXEL e log de tomadas

export function MedicamentosPanel()
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const addMedicamento = useTaskStore((s) => s.addMedicamento)
  const removeMedicamento = useTaskStore((s) => s.removeMedicamento)
  const registrarTomadaMedicamento = useTaskStore((s) => s.registrarTomadaMedicamento)
  const concluirHabito = useTaskStore((s) => s.concluirHabito)

  const [showForm, setShowForm] = useState(false)
  const [savingMed, setSavingMed] = useState(false)
  const [form, setForm] = useState({ nome: '', horarios: '08:00, 20:00' })

  const doses = useMemo(
    () => buildDosesHoje(medicamentos, medicamentoTomadas),
    [medicamentos, medicamentoTomadas],
  )

  const proxima = useMemo(() => proximaDosePendente(doses), [doses])
  const tomadasHoje = doses.filter((d) => d.status === 'tomado').length
  const totalDoses = doses.length

  const handleAdd = async () =>
  {
    if (savingMed) return
    const horarios = form.horarios
      .split(/[,;]+/)
      .map((h) => h.trim())
      .filter(Boolean)
    if (!form.nome.trim() || horarios.length === 0)
    {
      toast.error('Informe nome e pelo menos um horário (ex: 08:00, 20:00)')
      return
    }
    setSavingMed(true)
    try
    {
      await addMedicamento({
        nome: form.nome.trim(),
        horario: horarios[0],
        horarios,
      })
      setForm({ nome: '', horarios: '08:00, 20:00' })
      setShowForm(false)
      toast.success('Medicamento cadastrado — o AXEL acompanha os horários')
    }
    finally
    {
      setSavingMed(false)
    }
  }

  const handleRemove = async (id: number, nome: string) =>
  {
    if (!window.confirm(`Remover "${nome}" da sua lista?`)) return
    await removeMedicamento(id)
    toast.success('Medicamento removido')
  }

  const handleTomar = async (medicamentoId: number, horario: string) =>
  {
    await registrarTomadaMedicamento(medicamentoId, horario)
    concluirHabito(10)
    toast.success('Registrado no seu log de saúde', { duration: 2000 })
  }

  return (
    <div className="space-y-4">
      {proxima && (
        <section className="rounded-sl border border-teal-500/25 bg-teal-500/5 p-4">
          <p className="font-mono text-[9px] uppercase tracking-wider text-teal-300/90 mb-1">
            AXEL · lembrete gentil
          </p>
          <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
            {mensagemGentilDose(proxima)}
          </p>
          {proxima.status !== 'tomado' && (
            <button
              type="button"
              onClick={() => void handleTomar(proxima.medicamentoId, proxima.horario)}
              className="mt-3 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-sl bg-teal-600/20 border border-teal-500/30 text-teal-100 font-mono text-[11px] uppercase tracking-wide hover:bg-teal-600/30 transition-colors"
            >
              Sim, já tomei
            </button>
          )}
        </section>
      )}

      <section className="rounded-sl border border-line bg-card overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-line min-h-[52px]">
          <div className="flex items-center gap-2 min-w-0">
            <Pill className="w-4 h-4 text-teal-400 shrink-0" />
            <h2 className="text-[13px] font-semibold text-ink">Agenda de hoje</h2>
            <span className="font-mono text-[10px] text-ink-muted tabular-nums">
              {tomadasHoje}/{totalDoses} doses
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 px-3 py-2 rounded-sl text-[11px] text-accent hover:bg-accent-muted border border-line min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" /> Novo
          </button>
        </header>

        {showForm && (
          <div className="px-4 py-3 border-b border-line space-y-2">
            <input
              type="text"
              placeholder="Nome do medicamento"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[13px] text-ink min-h-[44px]"
            />
            <input
              type="text"
              placeholder="Horários: 08:00, 14:00, 20:00"
              value={form.horarios}
              onChange={(e) => setForm({ ...form, horarios: e.target.value })}
              className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[13px] text-ink min-h-[44px]"
            />
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Separe vários horários com vírgula. O AXEL pergunta com calma, sem alarmes agressivos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={savingMed}
                onClick={() => void handleAdd()}
                className="flex-1 py-2.5 rounded-sl bg-accent text-white font-mono text-[11px] uppercase min-h-[44px] disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2.5 text-ink-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {medicamentos.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Pill}
              title="Nenhum medicamento"
              description="Cadastre nome e horários. Cada dose gera lembrete gentil e entra no Kanban se atrasar."
              actionLabel="Cadastrar"
              onAction={() => setShowForm(true)}
            />
          </div>
        ) : doses.length === 0 ? (
          <p className="px-4 py-4 text-[12px] text-ink-muted">Adicione horários válidos (ex: 08:00).</p>
        ) : (
          <ul className="divide-y divide-line">
            {doses.map((dose) =>
            {
              const key = `${dose.medicamentoId}-${dose.horario}`
              const tomado = dose.status === 'tomado'
              return (
                <li key={key}>
                  <button
                    type="button"
                    disabled={tomado}
                    onClick={() => void handleTomar(dose.medicamentoId, dose.horario)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3.5 min-h-[56px] text-left transition-colors',
                      tomado ? 'opacity-70' : 'hover:bg-chrome/30 active:bg-chrome/50',
                      dose.status === 'atrasado' && !tomado ? 'border-l-[3px] border-l-amber-500/70' : 'border-l-[3px] border-l-transparent',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-5 h-5 rounded-sl border-2 flex items-center justify-center shrink-0',
                      tomado ? 'bg-teal-500 border-teal-500' : 'border-line',
                    ].join(' ')}>
                      {tomado && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] truncate ${tomado ? 'text-ink-muted line-through' : 'text-ink'}`}>
                        {dose.nome}
                      </p>
                      <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                        {tomado && dose.tomada
                          ? `Tomado às ${new Date(dose.tomada.tomado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : dose.status === 'futuro'
                            ? 'Ainda não é hora'
                            : dose.status === 'janela'
                              ? 'Na janela do horário'
                              : 'Horário passou — registre quando puder'}
                      </p>
                    </div>
                    <Clock className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="font-mono text-[12px] tabular-nums text-ink-muted shrink-0">{dose.horario}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {medicamentoTomadas.length > 0 && (
        <section className="rounded-sl border border-line bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-ink-muted" />
            <h3 className="text-[12px] font-semibold text-ink">Log de hoje</h3>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {[...medicamentoTomadas]
              .sort((a, b) => b.tomado_em.localeCompare(a.tomado_em))
              .map((t) =>
              {
                const med = medicamentos.find((m) => m.id === t.medicamento_id)
                const hora = new Date(t.tomado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <li key={t.id} className="flex justify-between gap-2 text-[12px]">
                    <span className="text-ink truncate">{med?.nome ?? 'Medicamento'}</span>
                    <span className="font-mono text-ink-muted tabular-nums shrink-0">
                      {t.horario_previsto} · {hora}
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {medicamentos.length > 0 && (
        <section className="rounded-sl border border-line bg-card overflow-hidden">
          <header className="px-4 py-2.5 border-b border-line">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Seus medicamentos</h3>
          </header>
          <ul className="divide-y divide-line">
            {medicamentos.map((med) =>
            {
              const slots = horariosDoMedicamento(med)
              const ok = medicamentoCompletoHoje(med, medicamentoTomadas)
              return (
                <li key={med.id} className="px-4 py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>{med.nome}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {ok && (
                        <span className="font-mono text-[9px] uppercase text-concluido">Completo hoje</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemove(med.id, med.nome)}
                        className="p-1.5 rounded-sl text-ink-muted hover:text-urgente hover:bg-urgente/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
                        aria-label={`Remover ${med.nome}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    {slots.join(' · ')}
                    {med.config?.notas ? ` — ${med.config.notas}` : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <MedicamentosBulkPanel variant="full" />
    </div>
  )
}

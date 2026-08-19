import { useMemo } from 'react'
import { Check, Clock, Pill, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { EmptyState } from '../../ui/EmptyState'
import {
  buildDosesHoje,
  mensagemGentilDose,
  proximaDosePendente,
} from '../../../lib/medicamentosSchedule'
import { buildMedicamentosAlertas } from '../../../lib/medicamentosAlerts'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { MedicamentosNotificationBanner } from './MedicamentosNotificationBanner'

interface MedicamentosTodayTabProps
{
  onGoCadastrar: () => void
}

export function MedicamentosTodayTab({ onGoCadastrar }: MedicamentosTodayTabProps)
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const registrarTomadaMedicamento = useTaskStore((s) => s.registrarTomadaMedicamento)
  const concluirHabito = useTaskStore((s) => s.concluirHabito)

  const doses = useMemo(
    () => buildDosesHoje(medicamentos, medicamentoTomadas),
    [medicamentos, medicamentoTomadas],
  )

  const proxima = useMemo(() => proximaDosePendente(doses), [doses])
  const alertas = useMemo(() => buildMedicamentosAlertas(medicamentos), [medicamentos])
  const tomadasHoje = doses.filter((d) => d.status === 'tomado').length
  const totalDoses = doses.length

  const handleTomar = async (medicamentoId: number, horario: string) =>
  {
    await registrarTomadaMedicamento(medicamentoId, horario)
    concluirHabito(10)
    toast.success('Dose registrada', { duration: 2000 })
  }

  return (
    <div className="space-y-4">
      <MedicamentosNotificationBanner />

      {alertas.length > 0 && (
        <section className="rounded-sl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarClock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[12px] font-semibold text-ink">Renovação e consultas</p>
            </div>
            <a
              href="/kanban"
              className="text-[10px] font-mono uppercase text-accent hover:underline shrink-0"
            >
              Ver Kanban
            </a>
          </div>
          <ul className="space-y-1.5">
            {alertas.slice(0, 4).map((a) => (
              <li key={`${a.medicamentoId}-${a.tipo}`} className={`text-[11px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                {a.mensagem}
              </li>
            ))}
          </ul>
        </section>
      )}

      {proxima && (
        <section className="rounded-sl border border-accent/25 bg-accent/5 p-4">
          <p className="font-mono text-[9px] uppercase tracking-wider text-accent/90 mb-1">
            Próxima dose
          </p>
          <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
            {mensagemGentilDose(proxima)}
          </p>
          {proxima.status !== 'tomado' && (
            <button
              type="button"
              onClick={() => void handleTomar(proxima.medicamentoId, proxima.horario)}
              className="mt-3 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-sl bg-accent/10 border border-accent/30 text-ink font-mono text-[11px] uppercase tracking-wide hover:bg-accent/15 transition-colors"
            >
              Sim, já tomei
            </button>
          )}
        </section>
      )}

      <section className="rounded-sl border border-line bg-card overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-line min-h-[52px]">
          <div className="flex items-center gap-2 min-w-0">
            <Pill className="w-4 h-4 text-accent shrink-0" />
            <h2 className="text-[13px] font-semibold text-ink">Agenda de hoje</h2>
            <span className="font-mono text-[10px] text-ink-muted tabular-nums">
              {tomadasHoje}/{totalDoses} doses
            </span>
          </div>
        </header>

        {medicamentos.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Pill}
              title="Nenhum medicamento"
              description="Cadastre nome e horários na aba Cadastrar. Cada dose pode gerar lembrete no horário."
              actionLabel="Ir para Cadastrar"
              onAction={onGoCadastrar}
              tone="accent"
            />
          </div>
        ) : doses.length === 0 ? (
          <p className="px-4 py-4 text-[12px] text-ink-muted">Nenhuma dose prevista para hoje.</p>
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
                      tomado ? 'bg-accent border-accent' : 'border-line',
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
                              : 'Horário passou. Registre quando puder'}
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
          <h3 className="text-[12px] font-semibold text-ink mb-3">Log de hoje</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
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
    </div>
  )
}

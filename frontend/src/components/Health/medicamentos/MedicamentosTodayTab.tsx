import { useMemo } from 'react'
import { Check, Pill, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { AxelListRow } from '../../ui/AxelListRow'
import {
  buildDosesHoje,
  mensagemGentilDose,
  proximaDosePendente,
} from '../../../lib/medicamentosSchedule'
import { buildMedicamentosAlertas } from '../../../lib/medicamentosAlerts'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY, AXEL_BTN_PRIMARY } from '../../../constants/axelSurfaces'
import { MedicamentosNotificationBanner } from './MedicamentosNotificationBanner'
import { DashboardCollapsible } from '../../dashboard/DashboardCollapsible'

interface MedicamentosTodayTabProps
{
  onGoCadastrar: () => void
}

function DoseAgendaList({
  doses,
  onTomar,
}: {
  doses: ReturnType<typeof buildDosesHoje>
  onTomar: (medicamentoId: number, horario: string) => void
})
{
  return (
    <ul>
      {doses.map((dose) =>
      {
        const key = `${dose.medicamentoId}-${dose.horario}`
        const tomado = dose.status === 'tomado'
        const sub = tomado && dose.tomada
          ? `Tomado às ${new Date(dose.tomada.tomado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : dose.status === 'futuro'
            ? 'Ainda não é hora'
            : dose.status === 'janela'
              ? 'Na janela do horário'
              : 'Horário passou. Registre quando puder'
        return (
          <AxelListRow
            key={key}
            title={dose.nome}
            subtitle={sub}
            titleClassName={tomado ? 'text-ink-muted line-through' : undefined}
            disabled={tomado}
            onClick={() => void onTomar(dose.medicamentoId, dose.horario)}
            trailing={dose.horario}
            iconNode={(
              <span className={[
                'w-5 h-5 rounded-sl border-2 flex items-center justify-center shrink-0',
                tomado ? 'bg-health border-health' : 'border-line',
              ].join(' ')}>
                {tomado && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
            )}
          />
        )
      })}
    </ul>
  )
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
    const { emitCareRegistered } = await import('../../../lib/healthVitality')
    emitCareRegistered()
    toast.success('Dose registrada', { duration: 2000 })
  }

  return (
    <div className="space-y-4">
      <MedicamentosNotificationBanner />

      {alertas.length > 0 && (
        <DashboardCollapsible
          title="Renovação e consultas"
          subtitle={`${alertas.length} lembrete(s) gentil(is)`}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <a
              href="/kanban"
              className="inline-block text-[10px] font-mono uppercase text-health hover:underline"
            >
              Ver no Kanban
            </a>
            <ul className="space-y-1.5">
              {alertas.slice(0, 4).map((a) => (
                <li key={`${a.medicamentoId}-${a.tipo}`} className={`text-[11px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                  <CalendarClock className="w-3 h-3 inline mr-1 text-amber-400 -mt-0.5" aria-hidden />
                  {a.mensagem}
                </li>
              ))}
            </ul>
          </div>
        </DashboardCollapsible>
      )}

      {proxima && (
        <section className="rounded-sl border border-health/25 bg-health-muted p-4">
          <p className="font-mono text-[9px] uppercase tracking-wider text-health mb-1">
            Próxima dose
          </p>
          <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
            {mensagemGentilDose(proxima)}
          </p>
          {proxima.status !== 'tomado' && (
            <button
              type="button"
              onClick={() => void handleTomar(proxima.medicamentoId, proxima.horario)}
              className="mt-3 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-sl bg-health-muted border border-health/30 text-ink font-mono text-[11px] uppercase tracking-wide hover:bg-health-muted/80 transition-colors"
            >
              Sim, já tomei
            </button>
          )}
        </section>
      )}

      {medicamentos.length === 0 ? (
        <section className="rounded-sl border border-line bg-card px-4 py-6 text-center space-y-2">
          <Pill className="w-5 h-5 text-health mx-auto" aria-hidden />
          <p className={`text-[15px] font-medium ${AXEL_TEXT_PRIMARY}`}>
            Nenhum remédio cadastrado ainda
          </p>
          <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            Quer que eu te lembre de algum? Cadastre nome e horários — sem cobrança.
          </p>
          <button
            type="button"
            onClick={onGoCadastrar}
            className={`mt-2 min-h-11 px-4 text-[13px] ${AXEL_BTN_PRIMARY}`}
          >
            Cadastrar
          </button>
        </section>
      ) : doses.length === 0 ? (
        <p className="text-[12px] text-ink-muted px-1">Nenhuma dose prevista para hoje.</p>
      ) : proxima ? (
        <DashboardCollapsible
          title="Agenda de hoje"
          subtitle={`${tomadasHoje}/${totalDoses} doses registradas`}
          defaultOpen={false}
        >
          <DoseAgendaList doses={doses} onTomar={(id, h) => void handleTomar(id, h)} />
        </DashboardCollapsible>
      ) : (
        <section className="rounded-sl border border-line bg-card overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line min-h-[52px]">
            <div className="flex items-center gap-2 min-w-0">
              <Pill className="w-4 h-4 text-health shrink-0" />
              <h2 className="text-[13px] font-semibold text-ink">Agenda de hoje</h2>
              <span className="font-mono text-[10px] text-ink-muted tabular-nums">
                {tomadasHoje}/{totalDoses} doses
              </span>
            </div>
          </header>
          <DoseAgendaList doses={doses} onTomar={(id, h) => void handleTomar(id, h)} />
        </section>
      )}

      {medicamentoTomadas.length > 0 && (
        <DashboardCollapsible
          title="Log de hoje"
          subtitle="Histórico das tomadas"
          defaultOpen={false}
        >
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
        </DashboardCollapsible>
      )}
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { History } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { formatTreinoLabel } from '../../../lib/academyTreinoCodes'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

function formatarData(iso: string): string
{
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatarHora(iso: string): string
{
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function AcademyHistoryTab()
{
  const sessoesTreinoMes = useTaskStore((s) => s.sessoesTreinoMes)
  const fetchSessoesTreinoMes = useTaskStore((s) => s.fetchSessoesTreinoMes)

  useEffect(() =>
  {
    void fetchSessoesTreinoMes()
  }, [fetchSessoesTreinoMes])

  const stats = useMemo(() =>
  {
    const concluidas = sessoesTreinoMes.filter((s) => s.concluido)
    const minutos = concluidas.reduce((acc, s) => acc + (s.duracao_real_min ?? 0), 0)
    const volume = sessoesTreinoMes.reduce(
      (acc, s) => acc + (s.volume_kg ?? s.detalhe?.volume_kg ?? 0),
      0,
    )
    return {
      total: sessoesTreinoMes.length,
      concluidas: concluidas.length,
      minutos,
      volume: Math.round(volume),
    }
  }, [sessoesTreinoMes])

  const mesLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <section className="rounded-sl border border-line bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-ink-muted" />
          <h2 className={`text-[14px] font-display font-medium ${AXEL_TEXT_PRIMARY}`}>
            Histórico · {mesLabel}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
          <div className="rounded-sl bg-chrome/60 py-2 px-1">
            <p className="text-[18px] text-ink tabular-nums">{stats.concluidas}</p>
            <p className="text-[9px] uppercase text-ink-muted">concluídas</p>
          </div>
          <div className="rounded-sl bg-chrome/60 py-2 px-1">
            <p className="text-[18px] text-ink tabular-nums">{stats.total}</p>
            <p className="text-[9px] uppercase text-ink-muted">iniciadas</p>
          </div>
          <div className="rounded-sl bg-chrome/60 py-2 px-1">
            <p className="text-[18px] text-ink tabular-nums">{stats.minutos}</p>
            <p className="text-[9px] uppercase text-ink-muted">min totais</p>
          </div>
          <div className="rounded-sl bg-chrome/60 py-2 px-1">
            <p className="text-[18px] text-ink tabular-nums">{stats.volume}</p>
            <p className="text-[9px] uppercase text-ink-muted">kg·rep</p>
          </div>
        </div>
        <p className={`text-[11px] mt-3 ${AXEL_TEXT_SECONDARY}`}>
          Cada sessão com cronômetro na aba Hoje conta para sua vitalidade.
        </p>
      </section>

      <section className="rounded-sl border border-line bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-line">
          <h3 className="text-[11px] font-mono uppercase text-ink-muted">Sessões do mês</h3>
        </header>
        {sessoesTreinoMes.length === 0 ? (
          <p className={`px-4 py-4 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhuma sessão registrada neste mês.
          </p>
        ) : (
          <ul className="divide-y divide-line max-h-[min(420px,50vh)] overflow-y-auto custom-scrollbar">
            {sessoesTreinoMes.map((s) =>
            {
              const codigo = s.treino_codigo ?? s.detalhe?.treino_codigo ?? ''
              const titulo = s.detalhe?.treino_titulo || s.tipo_treino
              const rotulo = codigo
                ? formatTreinoLabel(codigo, titulo)
                : titulo

              return (
              <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-3 min-h-[52px]">
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                    {rotulo}
                  </p>
                  <p className="text-[10px] font-mono text-ink-muted mt-0.5">
                    {formatarData(s.iniciado_em)} · {formatarHora(s.iniciado_em)}
                    {(s.volume_kg ?? s.detalhe?.volume_kg)
                      ? ` · ${Math.round(s.volume_kg ?? s.detalhe?.volume_kg ?? 0)} kg·rep`
                      : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[12px] text-ink tabular-nums">
                    {s.duracao_real_min != null ? `${s.duracao_real_min} min` : '-'}
                  </p>
                  <p className={`text-[9px] font-mono uppercase ${
                    s.concluido ? 'text-concluido' : 'text-ink-muted'
                  }`}>
                    {s.concluido ? 'concluída' : 'aberta'}
                  </p>
                </div>
              </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

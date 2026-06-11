import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Egg } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_PROGRESS,
  AXEL_SECTION_PAD,
  AXEL_SECTION_TITLE,
  AXEL_LINE,
} from '../../constants/axelSurfaces'

// Saúde e rotina — borderless, divisores internos border-white/5

const META_PROTEINA_PADRAO = 100
const MAX_OVOS = 3

export function SaudeBentoEditorial()
{
  const navigate = useNavigate()
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const [ovosConsumidos, setOvosConsumidos] = useState(0)

  useEffect(() =>
  {
    fetchHabitos()
    fetchMedicamentos()
  }, [fetchHabitos, fetchMedicamentos])

  const saude = useMemo(() =>
  {
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()

    const agua = habitos.find((h) => h.tipo === 'agua')
    const aguaCopos = agua?.progresso_atual ?? 0
    const aguaMeta = agua?.meta_diaria ?? 8
    const aguaPct = aguaMeta > 0 ? Math.round((aguaCopos / aguaMeta) * 100) : 0

    const proteina = habitos.find((h) => h.tipo === 'proteina')
    const proteinaAtual = proteina?.progresso_atual ?? 62
    const proteinaMeta = proteina?.meta_diaria ?? META_PROTEINA_PADRAO
    const proteinaPct = proteinaMeta > 0
      ? Math.min(100, Math.round((proteinaAtual / proteinaMeta) * 100))
      : 0

    const pendentes = (medicamentos || [])
      .filter((m) => !m.tomado && m.horario)
      .map((m) =>
      {
        const [h, mm] = m.horario!.split(':').map(Number)
        return { ...m, minutos: (h * 60 + mm) }
      })
      .sort((a, b) => a.minutos - b.minutos)

    const proximo = pendentes.find((m) => m.minutos >= nowMin) ?? pendentes[0]
    const atrasado = proximo ? proximo.minutos < nowMin : false

    return {
      aguaCopos,
      aguaMeta,
      aguaPct,
      proteinaAtual,
      proteinaMeta,
      proteinaPct,
      proximo,
      atrasado,
    }
  }, [medicamentos, habitos])

  const toggleOvo = (index: number) =>
  {
    setOvosConsumidos((prev) =>
    {
      if (index + 1 <= prev) return index
      return Math.min(MAX_OVOS, index + 1)
    })
  }

  return (
    <div className={`${AXEL_SECTION_PAD} flex flex-col lg:col-span-2`}>
      <div className="flex items-end justify-between gap-6 mb-8 shrink-0">
        <div>
          <h3 className={`${AXEL_SECTION_TITLE} mb-3`}>
            Saúde e rotina diária
          </h3>
          <p className="text-[22px] font-semibold tracking-tighter text-zinc-100 leading-none">
            Hoje
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/saude')}
          className="text-zinc-600 hover:text-zinc-400 transition-colors pb-1"
          aria-label="Abrir saúde"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 pb-8 ${AXEL_LINE}`}>
          <button
            type="button"
            onClick={() => navigate('/saude#hidratacao')}
            className="text-left group"
          >
            <p className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase mb-3">Hidratação</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[48px] font-semibold tabular-nums tracking-tighter text-zinc-100 leading-none">
                {saude.aguaPct}
              </span>
              <span className="text-[16px] text-zinc-600 font-medium">%</span>
            </div>
            <p className="text-[13px] text-zinc-500 mt-2 tracking-tight">
              {saude.aguaCopos} de {saude.aguaMeta} copos
            </p>
            <div className="mt-4 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${AXEL_PROGRESS}`}
                style={{ width: `${Math.min(100, saude.aguaPct)}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/saude#medicamentos')}
            className="text-left"
          >
            <p className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase mb-3">Próximo remédio</p>
            {saude.proximo ? (
              <>
                <p className={`text-[20px] font-semibold tracking-tighter leading-snug ${
                  saude.atrasado ? 'text-zinc-300' : 'text-zinc-100'
                }`}>
                  {saude.proximo.nome}
                </p>
                <p className="text-[13px] text-zinc-500 mt-1 font-mono tabular-nums tracking-tight">
                  {saude.proximo.horario}
                  {saude.atrasado && (
                    <span className="ml-2 text-zinc-600">· atrasado</span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-[15px] text-zinc-500 tracking-tight">Nenhum medicamento pendente</p>
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col pt-8 min-h-[120px]">
          <button
            type="button"
            onClick={() => navigate('/saude#alimentacao')}
            className="text-left mb-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase">Nutrição</p>
              <span className="text-[11px] text-zinc-600 tabular-nums">
                {saude.proteinaAtual}g / {saude.proteinaMeta}g
              </span>
            </div>
          </button>

          <p className="text-[13px] text-zinc-400 mb-3 tracking-tight">
            Meta de Proteína ({saude.proteinaMeta}g)
          </p>
          <div className="h-1.5 rounded-full bg-zinc-800/60 overflow-hidden mb-8">
            <div
              className={`h-full rounded-full transition-all duration-700 ${AXEL_PROGRESS}`}
              style={{ width: `${saude.proteinaPct}%` }}
            />
          </div>

          <div className="mt-auto">
            <p className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase mb-3">
              Ovos <span className="text-zinc-600 normal-case tracking-tight">(máx. {MAX_OVOS})</span>
            </p>
            <div className="flex items-center gap-3" role="group" aria-label="Controle de ovos">
              {Array.from({ length: MAX_OVOS }, (_, i) =>
              {
                const ativo = i < ovosConsumidos
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleOvo(i)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      ativo
                        ? AXEL_PROGRESS
                        : 'bg-zinc-900/40 hover:bg-zinc-900/70'
                    }`}
                    aria-label={`Ovo ${i + 1}${ativo ? ' consumido' : ''}`}
                    aria-pressed={ativo}
                  >
                    <Egg className={`w-3.5 h-3.5 ${ativo ? 'text-white' : 'text-zinc-600'}`} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Square } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { DEFAULT_TREINO_MINUTOS } from '../../constants/healthPresets'
import { formatElapsed } from '../../utils/workoutCompletion'

// Modo Academia — flow state 100% monocromático (Linear × Apple Health)
// data-academy-mode ativa tema preto/branco e remove distrações visuais

interface SerieMock
{
  id: number
  exercicio: string
  meta: string
  concluida: boolean
}

const SERIES_INICIAIS: SerieMock[] = [
  { id: 1, exercicio: 'Supino reto', meta: 'Série 1 · 8-10 reps', concluida: false },
  { id: 2, exercicio: 'Supino reto', meta: 'Série 2 · 8-10 reps', concluida: false },
  { id: 3, exercicio: 'Remada curvada', meta: 'Série 1 · 10-12 reps', concluida: false },
  { id: 4, exercicio: 'Remada curvada', meta: 'Série 2 · 10-12 reps', concluida: false },
  { id: 5, exercicio: 'Agachamento', meta: 'Série 1 · 6-8 reps', concluida: false },
]

export function AcademyModeView()
{
  const navigate = useNavigate()
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchSessaoTreinoAtiva = useTaskStore((s) => s.fetchSessaoTreinoAtiva)
  const iniciarTreino = useTaskStore((s) => s.iniciarTreino)
  const finalizarTreino = useTaskStore((s) => s.finalizarTreino)

  const [elapsedSec, setElapsedSec] = useState(0)
  const [series, setSeries] = useState<SerieMock[]>(SERIES_INICIAIS)
  const [serieAtiva, setSerieAtiva] = useState(0)

  const treinoPadrao = habitos.find((h) => h.tipo === 'treino')
  const nomeTreino = sessaoTreinoAtiva?.tipo_treino ?? treinoPadrao?.nome_exibicao ?? 'Treino'
  const metaMin = sessaoTreinoAtiva?.meta_minutos ?? treinoPadrao?.config?.meta_minutos ?? DEFAULT_TREINO_MINUTOS

  useEffect(() =>
  {
    document.documentElement.setAttribute('data-academy-mode', 'true')
    fetchSessaoTreinoAtiva()
    return () =>
    {
      document.documentElement.removeAttribute('data-academy-mode')
    }
  }, [fetchSessaoTreinoAtiva])

  useEffect(() =>
  {
    if (!sessaoTreinoAtiva)
    {
      setElapsedSec(0)
      return
    }

    const tick = () =>
    {
      const start = new Date(sessaoTreinoAtiva.iniciado_em).getTime()
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sessaoTreinoAtiva])

  const handleIniciar = async () =>
  {
    if (sessaoTreinoAtiva) return
    const habitoId = treinoPadrao?.id
    if (!habitoId)
    {
      toast.error('Cadastre um treino em Saúde primeiro')
      navigate('/saude#academia')
      return
    }
    await iniciarTreino(habitoId, nomeTreino, metaMin)
  }

  const handleProximaSerie = () =>
  {
    setSeries((prev) =>
    {
      const next = [...prev]
      if (next[serieAtiva])
      {
        next[serieAtiva] = { ...next[serieAtiva], concluida: true }
      }
      return next
    })
    setSerieAtiva((i) => Math.min(i + 1, series.length - 1))
  }

  const handleFinalizar = async () =>
  {
    if (!sessaoTreinoAtiva)
    {
      navigate('/')
      return
    }
    await finalizarTreino(sessaoTreinoAtiva.id)
    navigate('/')
  }

  const serieAtual = series[serieAtiva]

  return (
    <div
      data-academy-mode
      className="min-h-[calc(100vh-2rem)] bg-black text-white flex flex-col px-4 py-6 max-w-lg mx-auto"
    >
      {/* Cabeçalho mínimo — ausência de menu reforçada pelo App ocultando sidebar */}
      <header className="flex items-center justify-between mb-8">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Modo Academia
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[12px] text-zinc-500 hover:text-white tracking-tight"
        >
          Sair
        </button>
      </header>

      {/* Cronômetro gigante — legível a 3m, mono puro */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <p className="text-[11px] text-zinc-500 tracking-tight mb-3 uppercase">{nomeTreino}</p>
        <time
          className="font-mono text-[clamp(4rem,18vw,7rem)] font-medium tracking-tighter tabular-nums text-white leading-none"
          dateTime={`PT${elapsedSec}S`}
        >
          {sessaoTreinoAtiva ? formatElapsed(elapsedSec) : '00:00'}
        </time>
        <p className="text-[12px] text-zinc-600 mt-4 tracking-tight">
          Meta {metaMin} min
        </p>
      </div>

      {/* Lista ultra-compacta de séries — check-in com uma mão */}
      <div className="border-t border-white/10 pt-4 mb-6">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-2">
          Séries
        </p>
        <ul className="space-y-0">
          {series.map((s, idx) =>
          {
            const ativa = idx === serieAtiva && sessaoTreinoAtiva
            return (
              <li
                key={s.id}
                className={`flex items-center gap-3 py-2 border-b border-white/5 min-h-[36px] ${
                  ativa ? 'text-white' : s.concluida ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${
                  s.concluida ? 'text-white' : 'text-zinc-700'
                }`}>
                  {s.concluida && <Check className="w-3 h-3" strokeWidth={2.5} />}
                </span>
                <span className="flex-1 min-w-0 text-[13px] tracking-tight truncate">
                  {s.exercicio}
                </span>
                <span className="text-[11px] font-mono text-zinc-600 shrink-0">{s.meta}</span>
              </li>
            )
          })}
        </ul>
        {serieAtual && sessaoTreinoAtiva && (
          <p className="text-[12px] text-zinc-500 mt-3 tracking-tight">
            Agora: {serieAtual.exercicio} — {serieAtual.meta}
          </p>
        )}
      </div>

      {/* Botões grandes — uso com uma mão */}
      <div className="flex flex-col gap-3 pb-4">
        {!sessaoTreinoAtiva ? (
          <button
            type="button"
            onClick={handleIniciar}
            className="w-full py-4 rounded-lg bg-white text-black text-[15px] font-semibold tracking-tight hover:bg-zinc-200 transition-colors"
          >
            Iniciar treino
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleProximaSerie}
              className="w-full py-4 rounded-lg bg-white text-black text-[15px] font-semibold tracking-tight hover:bg-zinc-200 transition-colors"
            >
              Próxima série
            </button>
            <button
              type="button"
              onClick={handleFinalizar}
              className="w-full py-3 rounded-lg border border-white/20 text-zinc-300 text-[14px] font-medium tracking-tight hover:bg-white/5 flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Finalizar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

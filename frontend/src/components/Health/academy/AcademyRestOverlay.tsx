import { formatRestMmSs } from '../../../lib/academyWorkouts'

interface AcademyRestOverlayProps
{
  secondsLeft: number
  proximoExercicio: string
  onSkip: () => void
}

// Tela de descanso em foco - visível mesmo com celular bloqueado parcialmente (wake lock)

export function AcademyRestOverlay({
  secondsLeft,
  proximoExercicio,
  onSkip,
}: AcademyRestOverlayProps)
{
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 text-white"
      role="dialog"
      aria-label="Descanso entre séries"
      aria-live="polite"
    >
      <p className="text-[11px] uppercase tracking-widest text-emerald-400/80 mb-4">
        Descanso
      </p>
      <time className="font-mono text-[clamp(4rem,22vw,8rem)] font-medium tabular-nums text-emerald-400 leading-none">
        {formatRestMmSs(secondsLeft)}
      </time>
      <p className="text-[13px] text-zinc-400 mt-6 text-center max-w-xs">
        Próximo: <span className="text-white font-medium">{proximoExercicio}</span>
      </p>
      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Tela mantida acesa durante o descanso
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="mt-10 w-full max-w-xs py-4 rounded-xl bg-white/10 border border-white/20 text-[14px] font-medium hover:bg-white/15 transition-colors"
      >
        Pular descanso
      </button>
    </div>
  )
}

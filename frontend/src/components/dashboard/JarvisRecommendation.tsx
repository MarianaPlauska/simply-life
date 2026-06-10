import { useState } from 'react'
import { Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'

interface JarvisRecommendationProps
{
  text: string
}

// JARVIS — linha sutil com sparkles + recomendacao + feedback (Foi util?)
// Footer da coluna principal do dashboard

export function JarvisRecommendation({ text }: JarvisRecommendationProps)
{
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  return (
    <section className="flex items-start gap-3 px-4 py-3 bg-card border border-zinc-800 rounded-xl">
      <div className="shrink-0 w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-violet-300" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300 mb-0.5">
          Jarvis
        </div>
        <p className="text-[13px] text-zinc-200 leading-relaxed">{text}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-zinc-500 mr-1">Foi útil?</span>
        <button
          onClick={() => setFeedback('up')}
          className={`p-1.5 rounded-full transition-colors ${
            feedback === 'up' ? 'bg-emerald-500/15 text-emerald-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          aria-label="Útil"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setFeedback('down')}
          className={`p-1.5 rounded-full transition-colors ${
            feedback === 'down' ? 'bg-rose-500/15 text-rose-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          aria-label="Não útil"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}

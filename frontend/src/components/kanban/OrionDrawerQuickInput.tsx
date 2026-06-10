import { useState } from 'react'
import { Send } from 'lucide-react'

// Input fluido no rodapé do drawer — nota rápida para o activity log

interface OrionDrawerQuickInputProps
{
  onSubmit: (text: string) => void
  placeholder?: string
}

export function OrionDrawerQuickInput({
  onSubmit,
  placeholder = 'Comentário ou atualização rápida…',
}: OrionDrawerQuickInputProps)
{
  const [draft, setDraft] = useState('')

  const submit = () =>
  {
    const text = draft.trim()
    if (!text) return
    onSubmit(text)
    setDraft('')
  }

  return (
    <div className="relative mb-3">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) =>
        {
          if (e.key === 'Enter')
          {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        className="w-full bg-zinc-900/50 border border-white/[0.04] focus:border-indigo-500/50 focus:ring-0 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-400 px-4 py-2 pr-11 transition-all outline-none"
        aria-label="Comentário rápido"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!draft.trim()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Enviar"
      >
        <Send size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

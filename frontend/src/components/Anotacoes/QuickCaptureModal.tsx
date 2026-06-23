import { useState } from 'react'
import { X, BookOpen, Bell, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { AnotacaoTipo } from '../../store/slices/anotacoesSlice'

const TIPOS: { id: AnotacaoTipo; label: string; hint: string; Icon: typeof BookOpen }[] = [
  { id: 'diario', label: 'Diário', hint: 'Texto livre', Icon: BookOpen },
  { id: 'lembrete', label: 'Lembrete', hint: 'Vai pro Kanban', Icon: Bell },
  { id: 'lista', label: 'Lista', hint: 'Checklist / todos', Icon: ListChecks },
]

export function QuickCaptureModal()
{
  const isOpen = useTaskStore((s) => s.isQuickCaptureOpen)
  const setOpen = useTaskStore((s) => s.setQuickCaptureOpen)
  const addAnotacao = useTaskStore((s) => s.addAnotacao)

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [tipo, setTipo] = useState<AnotacaoTipo>('diario')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  function handleClose()
  {
    setTitulo('')
    setConteudo('')
    setTipo('diario')
    setOpen(false)
  }

  async function handleSave()
  {
    if (!conteudo.trim()) return
    setSaving(true)
    try
    {
      await addAnotacao(conteudo.trim(), titulo.trim() || undefined, tipo)
      if (tipo === 'lembrete')
      {
        toast.success('Lembrete salvo e enviado ao Kanban')
      }
      else
      {
        toast.success('Anotação salva')
      }
      handleClose()
    }
    catch
    {
      toast.error('Erro ao salvar anotação.')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Captura rápida</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4">
          {TIPOS.map(({ id, label, hint, Icon }) =>
          {
            const ativo = tipo === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTipo(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-center transition-colors ${
                  ativo
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{label}</span>
                <span className="text-[8px] opacity-70">{hint}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder={tipo === 'lembrete' ? 'Título da tarefa (opcional)' : 'Título (opcional)'}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
          />
          <textarea
            placeholder={
              tipo === 'lista'
                ? '- Item 1\n- Item 2\n- ...'
                : tipo === 'lembrete'
                  ? 'O que precisa lembrar?'
                  : 'O que está na sua mente?'
            }
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            autoFocus
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!conteudo.trim() || saving}
            className="px-5 py-2 text-[13px] font-semibold bg-white text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : tipo === 'lembrete' ? 'Salvar + Kanban' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { X, Wallet, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  guessCategoryId,
  looksLikeFinanceCapture,
  parseFinanceQuickCapture,
} from '../../lib/financeQuickCapture'
import { findCategory } from '../../lib/financeCategoryTree'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'

export function FinanceQuickCaptureModal()
{
  const isOpen = useTaskStore((s) => s.isFinanceQuickCaptureOpen)
  const setOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const seed = useTaskStore((s) => s.financeQuickCaptureSeed)
  const setSeed = useTaskStore((s) => s.setFinanceQuickCaptureSeed)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const categories = useTaskStore((s) => s.categories)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)

  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    if (isOpen)
    {
      setText(seed)
    }
  }, [isOpen, seed])

  if (!isOpen) return null

  const parsed = parseFinanceQuickCapture(text)

  const close = () =>
  {
    setText('')
    setSeed('')
    setOpen(false)
  }

  const save = async () =>
  {
    if (!parsed)
    {
      toast.error('Ex: gastei 45 almoço · recebi 2000 salário')
      return
    }

    setSaving(true)
    try
    {
      const catId = guessCategoryId(parsed.descricao, categories, parsed.tipo)
      const cat = catId ? findCategory(categories, catId) : undefined

      await addTransaction({
        descricao: parsed.descricao,
        valor: parsed.valor,
        tipo: parsed.tipo,
        categoria: parsed.tipo === 'receita' ? (cat?.nome ?? 'receita') : (cat?.nome ?? 'outros'),
        categoria_id: catId,
        data: new Date().toISOString().slice(0, 10),
        status_pagamento: 'pago',
        forma_pagamento: 'pix',
      })

      registerInteraction('financeiro')
      toast.success(
        parsed.tipo === 'receita'
          ? `Receita ${parsed.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} lançada`
          : `Gasto lançado — saldo atualizado`,
      )
      close()
    }
    catch
    {
      toast.error('Erro ao lançar')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-label="Fechar" />

      <div className="relative w-full sm:max-w-md border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-accent" />
            <h2 className="text-sm font-display uppercase tracking-wide text-ink">Lançar gasto rápido</h2>
          </div>
          <button type="button" onClick={close} className="p-2 text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
          {
            if (e.key === 'Enter') void save()
          }}
          placeholder="gastei 45 almoço · recebi 3000 salário"
          className="w-full border border-line rounded-sl bg-chrome px-3 py-3 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent/50"
          autoFocus
        />

        {parsed && (
          <div className="mt-3 flex items-start gap-2 rounded-sl border border-accent/30 bg-accent/5 px-3 py-2">
            <Sparkles size={14} className="text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {parsed.tipo === 'receita' ? 'Receita' : 'Gasto'}{' '}
              <span className="text-ink font-mono tabular-nums">
                {parsed.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              {' · '}{parsed.descricao}
              {looksLikeFinanceCapture(text) && ' — desconta do caixa (PIX pago)'}
            </p>
          </div>
        )}

        <p className="text-[10px] text-ink-muted mt-2 font-mono">
          Atalho: Ctrl+K → digite o gasto → Enter
        </p>

        <button
          type="button"
          disabled={saving || !parsed}
          onClick={() => void save()}
          className={`w-full mt-4 py-3 font-mono text-[11px] uppercase ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Salvando…' : 'Lançar agora'}
        </button>
      </div>
    </div>
  )
}

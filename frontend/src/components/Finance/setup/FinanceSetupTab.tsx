import { useState } from 'react'
import { Check, CreditCard, Pencil, Receipt, Settings2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { FinanceCashAccountCard } from '../FinanceCashAccountCard'
import { FinanceReconciliationCard } from '../overview/FinanceReconciliationCard'
import { FinanceImportExportPanel } from '../FinanceImportExportPanel'
import { CARD_CHIP_STYLES } from '../../../lib/financeCardTheme'
import type { VirtualCard } from '../../../store/storeTypes'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const GRADIENTS: VirtualCard['tipo_gradiente'][] = [
  'purple', 'obsidian', 'sunset', 'ocean', 'mint',
]

interface FinanceSetupTabProps
{
  onNavigate: (tab: 'cartoes' | 'contas-fixas' | 'faturas') => void
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
}

export function FinanceSetupTab({
  onNavigate,
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
}: FinanceSetupTabProps)
{
  const cards = useTaskStore((s) => s.cards)
  const updateCardProfile = useTaskStore((s) => s.updateCardProfile)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    nome: '',
    limite: '',
    dia_fechamento: '',
    dia_vencimento: '',
    tipo_gradiente: 'obsidian' as VirtualCard['tipo_gradiente'],
  })

  const startEdit = (card: VirtualCard) =>
  {
    setEditingId(card.id)
    setDraft({
      nome: card.nome,
      limite: String(card.limite),
      dia_fechamento: String(card.dia_fechamento ?? 5),
      dia_vencimento: String(card.dia_vencimento ?? 12),
      tipo_gradiente: card.tipo_gradiente,
    })
  }

  const saveCard = async () =>
  {
    if (!editingId) return
    const limite = parseFloat(draft.limite.replace(',', '.'))
    if (!draft.nome.trim() || Number.isNaN(limite) || limite <= 0)
    {
      toast.error('Nome e limite válidos são obrigatórios')
      return
    }

    await updateCardProfile(editingId, {
      nome: draft.nome.trim(),
      limite,
      dia_fechamento: parseInt(draft.dia_fechamento, 10) || 5,
      dia_vencimento: parseInt(draft.dia_vencimento, 10) || 12,
      tipo_gradiente: draft.tipo_gradiente,
    })
    setEditingId(null)
    toast.success('Cartão atualizado')
  }

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-accent" />
          <h2 className={AXEL_SECTION_TITLE}>Configurar finanças</h2>
        </div>
        <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
          Conta corrente, cartões, contas fixas e faturas — tudo num só lugar.
        </p>
      </header>

      <FinanceCashAccountCard
        saldoDisponivel={saldoDisponivel}
        saldoCorrente={saldoCorrente}
        reservaRestante={reservaRestante}
        saldoProjetadoDisponivel={saldoProjetadoDisponivel}
      />

      <FinanceReconciliationCard />

      <section className={AXEL_BORDERLESS_PANEL}>
        <header className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-accent" />
            <p className={AXEL_SECTION_TITLE}>Cartões</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cartoes')}
            className="font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] sm:min-h-0 px-2"
          >
            Ver faturas
          </button>
        </header>

        {cards.length === 0 && (
          <p className={`text-[12px] py-4 text-center ${AXEL_TEXT_SECONDARY}`}>
            Nenhum cartão — adicione na aba Cartões.
          </p>
        )}

        <ul className="space-y-2">
          {cards.map((card) =>
          {
            const isEditing = editingId === card.id
            return (
              <li key={card.id} className="border border-line rounded-sl p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={draft.nome}
                      onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                      className="w-full border border-line rounded-sl bg-chrome px-3 py-2 text-sm"
                      placeholder="Nome do cartão"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        inputMode="decimal"
                        value={draft.limite}
                        onChange={(e) => setDraft((d) => ({ ...d, limite: e.target.value }))}
                        className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono"
                        placeholder="Limite R$"
                      />
                      <input
                        value={draft.dia_vencimento}
                        onChange={(e) => setDraft((d) => ({ ...d, dia_vencimento: e.target.value }))}
                        className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono"
                        placeholder="Dia venc."
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENTS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, tipo_gradiente: g }))}
                          className={`w-7 h-7 rounded-full border-2 ${CARD_CHIP_STYLES[g].dot} ${
                            draft.tipo_gradiente === g ? 'ring-2 ring-accent' : 'opacity-60'
                          }`}
                          aria-label={`Cor ${g}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void saveCard()} className={`px-3 py-2 text-[10px] uppercase font-mono ${AXEL_BTN_PRIMARY}`}>
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        Salvar
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 text-[10px] uppercase font-mono border border-line rounded-sl">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CARD_CHIP_STYLES[card.tipo_gradiente].dot}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{card.nome}</p>
                        <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                          Limite {card.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          {' · '}vence dia {card.dia_vencimento}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(card)}
                      className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent min-h-[44px] px-2"
                    >
                      <Pencil size={11} />
                      Editar
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavigate('contas-fixas')}
          className={`${AXEL_BORDERLESS_PANEL} text-left flex items-center gap-3 min-h-[72px] hover:bg-chrome/40`}
        >
          <Receipt className="w-5 h-5 text-accent shrink-0" />
          <div>
            <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Contas fixas</p>
            <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>Aluguel, internet, assinaturas</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('faturas')}
          className={`${AXEL_BORDERLESS_PANEL} text-left flex items-center gap-3 min-h-[72px] hover:bg-chrome/40`}
        >
          <Wallet className="w-5 h-5 text-accent shrink-0" />
          <div>
            <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Faturas reservadas</p>
            <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>Parcelas e compromissos futuros</p>
          </div>
        </button>
      </div>

      <FinanceImportExportPanel />
    </div>
  )
}

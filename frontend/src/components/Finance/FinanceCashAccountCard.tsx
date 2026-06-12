import { useState } from 'react'
import { Pencil, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceCashAccountCardProps
{
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
}

export function FinanceCashAccountCard({
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
}: FinanceCashAccountCardProps)
{
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const setCashInitialBalance = useTaskStore((s) => s.setCashInitialBalance)

  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const startEdit = () =>
  {
    setVal(String(cashAccount.saldo_inicial || ''))
    setEditing(true)
  }

  const save = async () =>
  {
    const n = parseFloat(val.replace(',', '.'))
    if (Number.isNaN(n) || n < 0)
    {
      toast.error('Valor inválido')
      return
    }
    await setCashInitialBalance(n)
    setEditing(false)
    toast.success('Saldo inicial atualizado')
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL}`}>
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-accent" />
          <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Conta corrente
          </p>
        </div>
        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline"
        >
          <Pencil size={10} />
          Saldo inicial
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border border-line rounded-sl bg-chrome/40 px-3 py-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Disponível</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(saldoDisponivel)}</p>
        </div>
        <div className="border border-line rounded-sl bg-chrome/40 px-3 py-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Corrente</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(saldoCorrente)}</p>
        </div>
        <div className="border border-line rounded-sl bg-chrome/40 px-3 py-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Reservado</p>
          <p className="text-lg font-display tabular-nums text-atencao">{fmt(reservaRestante)}</p>
        </div>
        <div className="border border-line rounded-sl bg-chrome/40 px-3 py-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Projetado livre</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(saldoProjetadoDisponivel)}</p>
        </div>
      </div>

      <p className={`text-[10px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Saldo inicial: {fmt(cashAccount.saldo_inicial)}.
        PIX, débito e dinheiro pagos abatem na hora.
        Cartão abate o limite — o caixa só quando você pagar a fatura.
        Pendentes entram no projetado; reservas reduzem o disponível.
      </p>

      {editing && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Quanto tinha na conta?"
            className="flex-1 border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono"
          />
          <button type="button" onClick={() => void save()} className={`px-4 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}>
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 font-mono text-[10px] uppercase border border-line rounded-sl text-ink-muted"
          >
            Cancelar
          </button>
        </div>
      )}
    </section>
  )
}

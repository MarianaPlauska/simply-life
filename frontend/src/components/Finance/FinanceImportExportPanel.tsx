import { useRef, useState } from 'react'
import { Download, FileUp, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  exportTransactionsCsv,
  exportTransactionsPrintable,
  parseTransactionsCsv,
} from '../../lib/financeImportExport'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

export function FinanceImportExportPanel()
{
  const transactions = useTaskStore((s) => s.transactions)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const onImport = async (file: File) =>
  {
    setImporting(true)
    try
    {
      const text = await file.text()
      const rows = parseTransactionsCsv(text)
      if (rows.length === 0)
      {
        toast.error('Nenhuma linha válida no arquivo')
        return
      }

      for (const row of rows)
      {
        await addTransaction({
          descricao: row.descricao,
          valor: row.valor,
          tipo: row.tipo,
          data: row.data,
          categoria: row.categoria ?? 'Importado',
          forma_pagamento: 'outro',
          status_pagamento: 'pago',
        })
      }

      toast.success(`${rows.length} lançamento(s) importado(s)`)
    }
    catch
    {
      toast.error('Falha ao importar CSV')
    }
    finally
    {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <h3 className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Backup e importação</h3>
      <p className={`text-[12px] mt-1 mb-4 ${AXEL_TEXT_SECONDARY}`}>
        Exporte para contador ou planilha; importe extrato CSV/OFX manual quando Open Finance não estiver ativo.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportTransactionsCsv(transactions)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sl border border-line text-[11px] font-mono uppercase text-ink-muted hover:text-ink"
        >
          <Download size={14} />
          Exportar CSV
        </button>
        <button
          type="button"
          onClick={() => exportTransactionsPrintable(transactions, monthLabel)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sl border border-line text-[11px] font-mono uppercase text-ink-muted hover:text-ink"
        >
          <Printer size={14} />
          PDF / imprimir
        </button>
        <button
          type="button"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sl border border-accent/40 text-[11px] font-mono uppercase text-accent hover:bg-accent/10"
        >
          <FileUp size={14} />
          {importing ? 'Importando…' : 'Importar CSV'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.ofx"
          className="hidden"
          onChange={(e) =>
          {
            const file = e.target.files?.[0]
            if (file) void onImport(file)
          }}
        />
      </div>
    </section>
  )
}

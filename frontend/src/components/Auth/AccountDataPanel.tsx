import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { supabaseAuthHeaders } from '../../lib/supabaseAuthHeaders'
import { downloadAccountExport } from '../../lib/exportAccountData'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_BTN_GHOST, AXEL_BTN_PRIMARY, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

/** Exportar JSON e apagar a conta - direitos LGPD na UI */
export function AccountDataPanel()
{
  const logout = useTaskStore((s) => s.logout)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)

  const handleExport = () =>
  {
    downloadAccountExport()
    toast.success('Arquivo com os seus dados baixado')
  }

  const handleDelete = async () =>
  {
    if (confirmText !== 'APAGAR')
    {
      toast.error('Digite APAGAR para confirmar')
      return
    }
    setBusy(true)
    try
    {
      const headers = await supabaseAuthHeaders()
      const res = await fetch('/api/axel/account-delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ confirm: 'APAGAR' }),
      })
      if (!res.ok)
      {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error || 'Não foi possível apagar a conta')
      }
      await supabase.auth.signOut()
      await logout()
      toast.success('Conta apagada')
      window.location.href = '/login'
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Falha ao apagar a conta')
    }
    finally
    {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
          Os seus dados
        </p>
        <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
          Exporta um JSON com tarefas, lançamentos, hábitos, medicamentos e notas.
          Apagar a conta remove o cadastro e os dados no servidor - irreversível.
        </p>
      </div>
      <button
        type="button"
        onClick={handleExport}
        className={`${AXEL_BTN_PRIMARY} min-h-11 px-4 text-[13px]`}
      >
        Exportar meus dados
      </button>
      <div className="pt-2 border-t border-line space-y-2">
        <label className={`block text-[12px] ${AXEL_TEXT_SECONDARY}`} htmlFor="delete-confirm">
          Para apagar, escreva APAGAR
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[13px] text-ink"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={busy || confirmText !== 'APAGAR'}
          onClick={() => void handleDelete()}
          className={`${AXEL_BTN_GHOST} min-h-11 px-4 text-[13px] text-urgente border-urgente/40 disabled:opacity-40`}
        >
          {busy ? 'Apagando…' : 'Apagar conta e dados'}
        </button>
      </div>
    </div>
  )
}

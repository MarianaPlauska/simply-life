import { useEffect, useState } from 'react'
import { Users, ShieldCheck, Flame, Loader2 } from 'lucide-react'
import { fetchAllUserCards, type AdminUserCard } from '../../lib/adminUsers'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

/** Lista de usuários do sistema — visível apenas para contas admin */
export function ProfileAdminUsersPanel()
{
  const [users, setUsers] = useState<AdminUserCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() =>
  {
    let ativo = true
    setLoading(true)
    void fetchAllUserCards().then((rows) =>
    {
      if (ativo)
      {
        setUsers(rows)
        setLoading(false)
      }
    })
    return () => { ativo = false }
  }, [])

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} border-0 p-0`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-sl bg-chrome border border-line flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-accent" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className={`text-base font-display ${AXEL_TEXT_PRIMARY}`}>
            Usuários do sistema
          </h2>
          <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Perfis cadastrados no Simply-Life
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-ink-muted animate-spin" aria-label="Carregando usuários" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center rounded-sl border border-dashed border-line">
          <Users className="w-6 h-6 text-ink-muted mx-auto mb-2" aria-hidden />
          <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>Nenhum usuário encontrado</p>
          <p className="text-[11px] text-ink-muted mt-1">
            Confirme se a migration 035 foi aplicada no Supabase.
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-[10px] uppercase text-ink-muted mb-3">
            {users.length} usuário{users.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u.user_id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-sl bg-chrome/40 border border-line"
              >
                <div
                  className="w-9 h-9 rounded-sl bg-card border border-line flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  <span className="text-[12px] font-semibold text-ink">
                    {(u.display_name || '?').slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                      {u.display_name || 'Sem nome'}
                    </p>
                    {u.is_admin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sl bg-accent/15 text-accent text-[9px] font-mono uppercase">
                        <ShieldCheck className="w-2.5 h-2.5" aria-hidden />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-muted font-mono truncate">{u.user_id}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-ink-muted">
                  <span>Nv {u.level}</span>
                  <span className="inline-flex items-center gap-1 text-accent/90">
                    <Flame className="w-3 h-3" aria-hidden />
                    {u.streak_count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

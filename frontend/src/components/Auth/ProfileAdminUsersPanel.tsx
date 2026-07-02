import { useCallback, useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { fetchAllUserCards, type AdminUserCard } from '../../lib/adminUsers'
import { ProfileAdminUserEditor } from './ProfileAdminUserEditor'
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

  const reload = useCallback(() =>
  {
    setLoading(true)
    void fetchAllUserCards().then((rows) =>
    {
      setUsers(rows)
      setLoading(false)
    })
  }, [])

  useEffect(() =>
  {
    reload()
  }, [reload])

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
            Toque em um usuário para editar avatar, dashboard ou excluir a conta
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
        </div>
      ) : (
        <>
          <p className="font-mono text-[10px] uppercase text-ink-muted mb-3">
            {users.length} usuário{users.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-2">
            {users.map((u) => (
              <ProfileAdminUserEditor
                key={u.user_id}
                user={u}
                onUpdated={reload}
                onDeleted={reload}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

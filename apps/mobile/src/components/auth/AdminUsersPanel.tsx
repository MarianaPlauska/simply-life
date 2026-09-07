import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { ShieldCheck, Users } from 'lucide-react-native'
import { Card, Text, PrimaryButton, Field, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { getApiBaseUrl } from '../../lib/apiBase'
import { isUserConnected } from '@simply-life/shared'

type AdminCard = {
  user_id: string
  email?: string | null
  display_name: string
  axel_calls_you: string
  is_admin: boolean
  streak_count: number
  level: number
  last_seen_at?: string | null
  last_sign_in_at?: string | null
  created_at?: string | null
}

function whenLabel(iso: string | null | undefined): string
{
  if (!iso) return 'nunca'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'nunca'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminUsersPanel()
{
  const { space, colors } = useTheme()
  const [rows, setRows] = useState<AdminCard[]>([])
  const [editing, setEditing] = useState<AdminCard | null>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () =>
  {
    if (!supabaseConfigured) return
    const rpc = await supabase.rpc('admin_list_directory')
    if (!rpc.error && Array.isArray(rpc.data))
    {
      setRows(rpc.data as AdminCard[])
      return
    }
    const { data, error } = await supabase
      .from('user_public_cards')
      .select('user_id, display_name, axel_calls_you, is_admin, streak_count, level, last_seen_at')
      .order('updated_at', { ascending: false })
    if (error)
    {
      setMsg(error.message)
      return
    }
    setRows((data ?? []) as AdminCard[])
  }, [])

  useEffect(() =>
  {
    void load()
    const id = setInterval(() => void load(), 20_000)
    return () => clearInterval(id)
  }, [load])

  const saveName = async () =>
  {
    if (!editing) return
    setBusy(true)
    const { error } = await supabase
      .from('user_public_cards')
      .update({
        display_name: name.trim(),
        axel_calls_you: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', editing.user_id)
    setBusy(false)
    if (error)
    {
      setMsg(error.message)
      return
    }
    setEditing(null)
    setMsg('Usuário atualizado')
    void load()
  }

  const deleteUser = async (userId: string) =>
  {
    setBusy(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const res = await fetch(`${getApiBaseUrl()}/api/axel/admin-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: 'delete', userId }),
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok)
    {
      setMsg(body.error || 'Falha ao excluir')
      return
    }
    setMsg('Conta excluída')
    void load()
  }

  if (!supabaseConfigured)
  {
    return <EmptyState title="Admin" body="Indisponível no modo offline." />
  }

  const online = rows.filter((u) => isUserConnected(u.last_seen_at)).length

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${colors.axel}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={20} color={colors.axel} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">Usuários</Text>
          <Text variant="caption" muted>
            {rows.length} conta{rows.length === 1 ? '' : 's'} · {online} conectada{online === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
      <Text variant="caption" muted>
        Contas que criaram login e estão com o app aberto aparecem como conectadas.
      </Text>
      {msg ? (
        <Text variant="caption" color={colors.axel}>
          {msg}
        </Text>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum usuário visível"
          body="Aplique a migration de admin no Supabase ou verifique se você está logada como admin."
          icon="people-outline"
        />
      ) : (
        rows.map((u) =>
        {
          const connected = isUserConnected(u.last_seen_at)
          const label = u.display_name || u.axel_calls_you || u.email || 'Sem nome'
          return (
            <Card key={u.user_id} tone="elevated" style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: connected ? colors.health : colors.inkFaint,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {label}
                    </Text>
                    {u.is_admin ? <ShieldCheck size={16} color={colors.axel} /> : <Users size={14} color={colors.inkFaint} />}
                  </View>
                  <Text variant="caption" muted numberOfLines={1}>
                    {u.email || 'sem e-mail'} · {connected ? 'conectada agora' : `visto ${whenLabel(u.last_seen_at || u.last_sign_in_at)}`}
                  </Text>
                </View>
              </View>
              <Text variant="micro" muted>
                Nível {u.level ?? 1} · ofensiva {u.streak_count ?? 0}
                {u.created_at ? ` · desde ${whenLabel(u.created_at)}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                <PrimaryButton
                  label="Editar"
                  variant="secondary"
                  size="sm"
                  onPress={() =>
                  {
                    setEditing(u)
                    setName(u.display_name || u.axel_calls_you || '')
                  }}
                />
                <PrimaryButton
                  label="Excluir"
                  variant="danger"
                  size="sm"
                  loading={busy}
                  onPress={() => void deleteUser(u.user_id)}
                />
              </View>
            </Card>
          )
        })
      )}
      {editing ? (
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Editar {editing.display_name}</Text>
          <Field label="Nome de exibição" value={name} onChangeText={setName} />
          <PrimaryButton label="Salvar" loading={busy} onPress={() => void saveName()} />
          <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setEditing(null)} />
        </Card>
      ) : null}
    </View>
  )
}

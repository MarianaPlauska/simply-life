import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Card, Text, PrimaryButton, Field, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { getApiBaseUrl } from '../../lib/apiBase'

type AdminCard = {
  user_id: string
  display_name: string
  axel_calls_you: string
  is_admin: boolean
  streak_count: number
  level: number
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
    const { data, error } = await supabase
      .from('user_public_cards')
      .select('user_id, display_name, axel_calls_you, is_admin, streak_count, level')
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

  return (
    <View style={{ gap: space.md }}>
      <Text variant="section">Usuários</Text>
      <Text variant="caption" muted>
        Administração do sistema. Toque para editar o nome.
      </Text>
      {msg ? (
        <Text variant="caption" color={colors.axel}>
          {msg}
        </Text>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="Nenhum usuário visível" body="A RLS de admin precisa estar ativa." />
      ) : (
        rows.map((u) => (
          <Card key={u.user_id} tone="elevated" style={{ gap: space.sm }}>
            <Text variant="bodyStrong">
              {u.display_name || u.axel_calls_you || 'Sem nome'}
            </Text>
            <Text variant="caption" muted>
              Nível {u.level ?? 1} · ofensiva {u.streak_count ?? 0}
              {u.is_admin ? ' · admin' : ''}
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
                variant="ghost"
                size="sm"
                loading={busy}
                onPress={() => void deleteUser(u.user_id)}
              />
            </View>
          </Card>
        ))
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

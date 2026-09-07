import { useCallback, useEffect, useState } from 'react'
import { Share, View } from 'react-native'
import { Card, Text, SectionHeader, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import {
  createPartnerInvite,
  fetchPartnerWorkspace,
  type PartnerWorkspaceState,
} from '../../lib/partnerWorkspace'

export function InvitePartnerCard()
{
  const { space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const [state, setState] = useState<PartnerWorkspaceState | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () =>
  {
    if (isGuest)
    {
      setState(null)
      return
    }
    setState(await fetchPartnerWorkspace())
  }, [isGuest])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  if (isGuest)
  {
    return null
  }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <SectionHeader
        title="Parceiro financeiro"
        subtitle="Convite dedicado, sem Open Finance"
      />
      {state?.partnerUserId ? (
        <Text variant="body">
          Conectado com {state.partnerDisplayName}. No gasto, escolha Pessoal ou
          Casal. Pessoal pago na conta do casal fica marcado sem misturar totais.
        </Text>
      ) : (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted>
            Gere um link /parceiro/… para conectar a conta do parceiro no mesmo
            workspace.
          </Text>
          {!inviteUrl ? (
            <PrimaryButton
              label={busy ? 'Gerando…' : 'Gerar convite'}
              disabled={busy}
              onPress={() =>
              {
                setBusy(true)
                void createPartnerInvite().then((r) =>
                {
                  setBusy(false)
                  if (!r)
                  {
                    setMsg('Não foi possível gerar. Confira a migration 053.')
                    return
                  }
                  setInviteUrl(r.url)
                  setMsg('Link pronto por 7 dias')
                  void reload()
                })
              }}
            />
          ) : (
            <>
              <Text variant="caption" style={{ fontFamily: 'monospace' }}>
                {inviteUrl}
              </Text>
              <PrimaryButton
                label="Compartilhar link"
                onPress={() =>
                {
                  void Share.share({ message: inviteUrl, url: inviteUrl }).then(() =>
                  {
                    setMsg('Link compartilhado')
                  })
                }}
              />
            </>
          )}
          {msg ? (
            <Text variant="caption" muted>
              {msg}
            </Text>
          ) : null}
        </View>
      )}
    </Card>
  )
}

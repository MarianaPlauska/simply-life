import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { completeGoogleOAuth, parseAuthCallbackParams } from '@simply-life/shared'
import { Screen, Text, PrimaryButton } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { authedApi } from '../src/lib/integrationsApi'

const STATE_KEY = 'axel-google-oauth-state'

/** Callback da integração Google Calendar/Gmail (não é login) */
export default function GoogleIntegrationCallbackScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() =>
  {
    if (typeof window === 'undefined') return
    const params = parseAuthCallbackParams(window.location.href)
    if (params.error)
    {
      setStatus('error')
      setErrorMsg('Autorização cancelada ou negada pelo Google.')
      return
    }
    if (!params.code)
    {
      setStatus('error')
      setErrorMsg('Código de autorização ausente.')
      return
    }

    let saved: string | null = null
    try
    {
      saved = sessionStorage.getItem(STATE_KEY)
      sessionStorage.removeItem(STATE_KEY)
    }
    catch
    {
      /* native */
    }

    void (async () =>
    {
      try
      {
        const api = await authedApi()
        await completeGoogleOAuth(api, params.code as string, params.state || saved)
        setStatus('success')
        window.setTimeout(() => router.replace('/configuracoes'), 1200)
      }
      catch (err)
      {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar Google')
      }
    })()
  }, [router])

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md }}>
        {status === 'processing' ? (
          <>
            <ActivityIndicator color={colors.axel} />
            <Text variant="body" muted>
              Conectando Google (Calendar + Gmail)…
            </Text>
          </>
        ) : null}
        {status === 'success' ? (
          <Text variant="body">Conectado. Indo para Configurações…</Text>
        ) : null}
        {status === 'error' ? (
          <>
            <Text variant="section">Falha na conexão</Text>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {errorMsg}
            </Text>
            <PrimaryButton
              label="Ir para Configurações"
              onPress={() => router.replace('/configuracoes')}
            />
          </>
        ) : null}
      </View>
    </Screen>
  )
}

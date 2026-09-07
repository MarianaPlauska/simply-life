import { useCallback, useEffect, useState } from 'react'
import { View, Linking, Platform } from 'react-native'
import { Redirect } from 'expo-router'
import {
  fetchGmailImapStatus,
  saveGmailImapSettings,
  syncGmailImap,
  sendGmailImapTestMail,
  fetchGoogleStatus,
  startGoogleOAuth,
  disconnectGoogle,
  syncGmailNow,
  type GmailImapStatus,
  type GoogleConnectionStatus,
} from '@simply-life/shared'
import { Screen, Text, Card, PillTabs, PrimaryButton, Field } from '../src/ui'
import { GamificationPanel } from '../src/components/dashboard/GamificationPanel'
import { SettingsHero } from '../src/components/settings/SettingsHero'
import { SettingsToggleRow } from '../src/components/settings/SettingsToggleRow'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { authedApi } from '../src/lib/integrationsApi'
import { getApiBaseUrl } from '../src/lib/apiBase'
import { supabase } from '../src/lib/supabase'

type Tab = 'integracoes' | 'webhooks' | 'sistema' | 'gamificacao'

const STATE_KEY = 'axel-google-oauth-state'

export default function ConfiguracoesScreen()
{
  const { space, colors } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const prefs = usePrefsStore((s) => s.prefs)
  const keywords = usePrefsStore((s) => s.keywords)
  const patch = usePrefsStore((s) => s.patch)
  const addKeyword = usePrefsStore((s) => s.addKeyword)
  const removeKeyword = usePrefsStore((s) => s.removeKeyword)
  const [tab, setTab] = useState<Tab>('integracoes')
  const [imap, setImap] = useState<GmailImapStatus | null>(null)
  const [google, setGoogle] = useState<GoogleConnectionStatus | null>(null)
  const [email, setEmail] = useState('')
  const [appPass, setAppPass] = useState('')
  const [kw, setKw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasWebhook, setHasWebhook] = useState(false)
  const [plainSecret, setPlainSecret] = useState<string | null>(null)

  const loadIntegrations = useCallback(async () =>
  {
    if (isGuest) return
    try
    {
      const api = await authedApi()
      const [imapStatus, googleStatus] = await Promise.all([
        fetchGmailImapStatus(api),
        fetchGoogleStatus(api),
      ])
      setImap(imapStatus)
      setGoogle(googleStatus)
      if (imapStatus.email) setEmail(imapStatus.email)
    }
    catch (e)
    {
      setMsg(e instanceof Error ? e.message : 'Falha ao carregar integrações')
    }
  }, [isGuest])

  useEffect(() =>
  {
    void hydrate()
    void loadIntegrations()
    void (async () =>
    {
      if (isGuest) return
      const { data, error } = await supabase.rpc('webhook_secret_configured')
      if (!error) setHasWebhook(Boolean(data))
    })()
  }, [hydrate, loadIntegrations, isGuest])

  if (!userId) return <Redirect href="/login" />

  const endpoint = `${getApiBaseUrl()}/api/webhooks/ingest`

  return (
    <Screen scroll tabBarInset={false}>
      <SettingsHero title="Configurações" />
      <View style={{ gap: space.lg }}>
        <PillTabs
          tabs={[
            { id: 'integracoes', label: 'Integrações' },
            { id: 'webhooks', label: 'Webhooks' },
            { id: 'sistema', label: 'Sistema' },
            { id: 'gamificacao', label: 'AXEL' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {msg ? (
          <Text variant="caption" color={colors.axel}>
            {msg}
          </Text>
        ) : null}

        {tab === 'integracoes' ? (
          <View style={{ gap: space.md }}>
            <Card tone="elevated" style={{ gap: space.md, borderRadius: 22 }}>
              <Text variant="section">Gmail com senha de app</Text>
              <Text variant="caption" muted>
                {imap?.configured
                  ? `Configurado: ${imap.email ?? 'conta'}. Último sync: ${imap.last_sync_at ?? 'nunca'}`
                  : 'Email grátis via IMAP. Não exige Google Cloud.'}
              </Text>
              <Field
                label="Email Gmail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Field
                label="Senha de app"
                secureTextEntry
                value={appPass}
                onChangeText={setAppPass}
              />
              <PrimaryButton
                label="Salvar IMAP"
                loading={busy}
                disabled={isGuest}
                onPress={() =>
                {
                  void (async () =>
                  {
                    setBusy(true)
                    try
                    {
                      const api = await authedApi()
                      await saveGmailImapSettings(api, email, appPass)
                      setMsg('IMAP salvo')
                      await loadIntegrations()
                    }
                    catch (e)
                    {
                      setMsg(e instanceof Error ? e.message : 'Falha ao salvar')
                    }
                    setBusy(false)
                  })()
                }}
              />
              <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                <PrimaryButton
                  label="Sincronizar IMAP"
                  variant="secondary"
                  disabled={isGuest || !imap?.configured}
                  onPress={() =>
                  {
                    void (async () =>
                    {
                      try
                      {
                        const api = await authedApi()
                        const r = await syncGmailImap(api)
                        setMsg(`${r.tarefas_geradas} tarefa(s) de ${r.emails_lidos} e-mail(s)`)
                      }
                      catch (e)
                      {
                        setMsg(e instanceof Error ? e.message : 'Erro no sync')
                      }
                    })()
                  }}
                />
                <PrimaryButton
                  label="Email de teste"
                  variant="ghost"
                  disabled={isGuest}
                  onPress={() =>
                  {
                    void (async () =>
                    {
                      try
                      {
                        const api = await authedApi()
                        await sendGmailImapTestMail(api)
                        setMsg('Email de teste enviado')
                      }
                      catch (e)
                      {
                        setMsg(e instanceof Error ? e.message : 'Falha no teste')
                      }
                    })()
                  }}
                />
              </View>
            </Card>

            <Card tone="elevated" style={{ gap: space.md, borderRadius: 22 }}>
              <Text variant="section">Google OAuth (opcional)</Text>
              <Text variant="caption" muted>
                {google?.connected
                  ? 'OAuth ativo. Calendar + Gmail.'
                  : 'Opcional. Exige projeto no Google Cloud.'}
              </Text>
              {google?.connected ? (
                <>
                  <PrimaryButton
                    label="Sincronizar Gmail"
                    onPress={() =>
                    {
                      void (async () =>
                      {
                        try
                        {
                          const api = await authedApi()
                          const r = await syncGmailNow(api)
                          setMsg(`${r.tarefas_geradas} tarefa(s) de ${r.emails_lidos} e-mail(s)`)
                        }
                        catch (e)
                        {
                          setMsg(e instanceof Error ? e.message : 'Erro no sync Gmail')
                        }
                      })()
                    }}
                  />
                  <PrimaryButton
                    label="Desconectar"
                    variant="ghost"
                    onPress={() =>
                    {
                      void (async () =>
                      {
                        const api = await authedApi()
                        await disconnectGoogle(api)
                        setMsg('Google desconectado')
                        await loadIntegrations()
                      })()
                    }}
                  />
                </>
              ) : (
                <PrimaryButton
                  label="Conectar Google"
                  disabled={isGuest}
                  onPress={() =>
                  {
                    void (async () =>
                    {
                      try
                      {
                        const api = await authedApi()
                        const started = await startGoogleOAuth(api)
                        if (started.state && Platform.OS === 'web')
                        {
                          sessionStorage.setItem(STATE_KEY, started.state)
                        }
                        await Linking.openURL(started.url)
                      }
                      catch (e)
                      {
                        setMsg(e instanceof Error ? e.message : 'Erro ao iniciar OAuth')
                      }
                    })()
                  }}
                />
              )}
            </Card>
          </View>
        ) : null}

        {tab === 'webhooks' ? (
          <Card tone="elevated" style={{ gap: space.md, borderRadius: 22 }}>
            <Text variant="section">Webhooks AXEL</Text>
            <Text variant="caption" muted>
              Endpoint: {endpoint}
            </Text>
            <Text variant="caption" muted>
              {hasWebhook ? 'Secret configurado.' : 'Nenhum secret ainda.'}
            </Text>
            {plainSecret ? (
              <Text variant="caption">{plainSecret}</Text>
            ) : null}
            <PrimaryButton
              label="Gerar / rotacionar secret"
              disabled={isGuest}
              onPress={() =>
              {
                void (async () =>
                {
                  const { data, error } = await supabase.rpc('rotate_webhook_secret')
                  if (error || typeof data !== 'string')
                  {
                    setMsg(error?.message ?? 'Rode a migration 037 no Supabase.')
                    return
                  }
                  setHasWebhook(true)
                  setPlainSecret(data)
                  setMsg('Secret gerado. Copie agora. Não será exibido de novo.')
                })()
              }}
            />
          </Card>
        ) : null}

        {tab === 'sistema' ? (
          <View style={{ gap: space.md }}>
            <SettingsToggleRow
              icon="sparkles-outline"
              title="Coach de IA"
              subtitle="Sugestões do AXEL no dia a dia"
              value={prefs.ai_coach_enabled}
              onValueChange={(next) => void patch({ ai_coach_enabled: next })}
            />
            <Card tone="elevated" style={{ gap: space.md, borderRadius: 22 }}>
              <Text variant="section">Palavras-chave de email</Text>
              <Field
                label="Nova palavra"
                value={kw}
                onChangeText={setKw}
                onSubmitEditing={() =>
                {
                  void addKeyword(kw)
                  setKw('')
                }}
              />
              {keywords.map((k) => (
                <PrimaryButton
                  key={k}
                  label={`Remover ${k}`}
                  variant="ghost"
                  size="sm"
                  onPress={() => void removeKeyword(k)}
                />
              ))}
            </Card>
          </View>
        ) : null}

        {tab === 'gamificacao' ? <GamificationPanel /> : null}
      </View>
    </Screen>
  )
}

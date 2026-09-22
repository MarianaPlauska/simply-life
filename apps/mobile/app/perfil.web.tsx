import { useEffect, useState } from 'react'
import { View, Switch, Modal, Pressable } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ShieldCheck } from 'lucide-react-native'
import { WebHoverable } from '../src/components/dashboard/web/WebHoverable'
import { webStyle } from '../src/components/dashboard/web/webStyle'
import { createFriendInvite } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Field } from '../src/ui'
import { MfaEnrollPanel } from '../src/components/auth/MfaEnrollPanel'
import { AdminUsersPanel } from '../src/components/auth/AdminUsersPanel'
import { ForgotPasswordSheet } from '../src/components/auth/ForgotPasswordSheet'
import { GamificationPanel } from '../src/components/dashboard/GamificationPanel'
import { WebProfileRow, WebProfileSection } from '../src/components/profile/web/WebProfileRow'
import { WEB_DISPLAY_FONT } from '../src/components/dashboard/web/webTypography'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { supabase } from '../src/lib/supabase'
import { appOrigin } from '../src/lib/appOrigin'
import { resolveAxelName } from '../src/lib/axelName'

type Sheet = 'nome' | 'a11y' | 'seguranca' | 'circulo' | 'xp' | 'admin' | 'senha' | null

const AVATAR_TINTS = ['#E8734A', '#C45A32', '#F2EDE6', '#A69C8E', '#6B7FD7'] as const

/**
 * Perfil — build web. Mesma lógica de conta de perfil.tsx, mas sem o hero
 * gigante, sem repetir "Seu resumo" (já está na Home) e com Redefinir senha
 * e Sair da conta em destaque. App nativo continua usando perfil.tsx.
 */
export default function PerfilScreenWeb()
{
  const { space, colors, mode, setMode } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const signOut = useAuthStore((s) => s.signOut)
  const refreshAdmin = useAuthStore((s) => s.refreshAdminFlag)
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const history = useGamificationStore((s) => s.history)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [invite, setInvite] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() =>
  {
    void hydrate()
    void refreshAdmin()
  }, [hydrate, refreshAdmin])

  useEffect(() =>
  {
    setName(prefs.axel_calls_you || prefs.display_name)
    setPhone(prefs.profile_phone || '')
    setCity(prefs.profile_city || '')
  }, [prefs.axel_calls_you, prefs.display_name, prefs.profile_phone, prefs.profile_city])

  if (!userId) return <Redirect href="/login" />

  const displayName = resolveAxelName({
    isGuest,
    callsYou: prefs.axel_calls_you,
    displayName: prefs.display_name,
    email,
  })
  const initial = displayName.slice(0, 1).toUpperCase()
  const avatarTint = prefs.profile_avatar_tint || colors.axel
  const recent = history.slice(0, 4)
  const memberSince = prefs.setup_completed_at
    ? new Date(prefs.setup_completed_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : isGuest
      ? 'Modo demo'
      : 'Conta ativa'

  const closeSheet = () => setSheet(null)

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center', gap: space.lg, paddingTop: space.sm }}>
        <WebHoverable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          accessibilityLabel="Voltar"
          style={webStyle({ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', cursor: 'pointer' })}
        >
          <Ionicons name="chevron-back" size={14} color={colors.inkMuted} />
          <Text variant="caption" muted>
            Voltar
          </Text>
        </WebHoverable>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, color: colors.ink }}>
          Perfil
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            onPress={() => setSheet('nome')}
            accessibilityLabel="Editar perfil"
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              backgroundColor: `${avatarTint}22`,
              borderWidth: 2,
              borderColor: avatarTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 20, color: avatarTint }}>
              {initial}
            </Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 16 }}>
                {displayName}
              </Text>
              {isAdmin ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} color={colors.axel} />
                  <Text variant="micro" style={{ color: colors.axel, fontWeight: '700' }}>
                    Admin
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" muted numberOfLines={1}>
              {email ?? (isGuest ? 'Modo convidado' : 'sem e-mail')}
            </Text>
          </View>
        </View>

        <WebProfileSection title="Conta">
          <WebProfileRow
            label="Redefinir senha"
            value={isGuest ? 'Indisponível no modo demo' : undefined}
            onPress={isGuest ? undefined : () => setSheet('senha')}
          />
          <WebProfileRow
            label="Sincronização na nuvem"
            value={prefs.cloud_sync_opt_in ? 'Opt-in' : 'Local'}
            onPress={() => void patch({ cloud_sync_opt_in: !prefs.cloud_sync_opt_in })}
          />
          <WebProfileRow
            label="Sair da conta"
            danger
            onPress={() => void signOut().then(() => router.replace('/login'))}
          />
        </WebProfileSection>

        <WebProfileSection title="Dados pessoais">
          <WebProfileRow label="E-mail" value={email ?? '-'} />
          <WebProfileRow
            label="Telefone"
            value={prefs.profile_phone?.trim() || 'Adicionar'}
            onPress={() => setSheet('nome')}
          />
          <WebProfileRow label="Data de registro" value={memberSince} />
          <WebProfileRow
            label="Cidade"
            value={prefs.profile_city?.trim() || 'Adicionar'}
            onPress={() => setSheet('nome')}
          />
          <WebProfileRow
            label="Como o AXEL te chama"
            value={displayName}
            onPress={() => setSheet('nome')}
          />
        </WebProfileSection>

        <WebProfileSection title="Configurações">
          <WebProfileRow
            label="Acessibilidade"
            value={
              prefs.a11y_large_text || prefs.a11y_reduce_motion || prefs.a11y_high_contrast
                ? 'Ativa'
                : 'Padrão'
            }
            onPress={() => setSheet('a11y')}
          />
          <WebProfileRow label="Segurança (MFA)" onPress={() => setSheet('seguranca')} />
          <WebProfileRow
            label="Aparência"
            value={mode === 'dark' ? 'Escuro' : 'Claro'}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          />
          <WebProfileRow label="Preferências" onPress={() => router.push('/preferencias')} />
          <WebProfileRow label="Configurações e integrações" onPress={() => router.push('/configuracoes')} />
          <WebProfileRow label="Círculo" onPress={() => setSheet('circulo')} />
          <WebProfileRow label="AXEL / XP" onPress={() => setSheet('xp')} />
          {isAdmin ? (
            <WebProfileRow label="Admin · Usuários" onPress={() => setSheet('admin')} />
          ) : null}
        </WebProfileSection>

        <WebProfileSection title="Histórico de atividade">
          {recent.length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text variant="caption" muted>
                Ainda sem eventos. Complete uma tarefa ou um check-in.
              </Text>
            </View>
          ) : (
            recent.map((h) => (
              <WebProfileRow
                key={h.id}
                label={h.title}
                value={new Date(h.at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            ))
          )}
          <WebProfileRow label="Ver histórico AXEL" onPress={() => router.push('/axel/historico')} />
        </WebProfileSection>
      </View>

      <ForgotPasswordSheet visible={sheet === 'senha'} initialEmail={email ?? ''} onClose={closeSheet} />

      {/* Diálogos centrados (não sheets de baixo, como no mobile) */}
      <Modal visible={sheet === 'nome'} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <Card tone="elevated" style={{ gap: space.md, width: '100%', maxWidth: 440 }}>
            <Text variant="section">Editar dados</Text>
            <Text variant="caption" muted>
              Esses campos ficam locais hoje e entram na fila de sync na nuvem com o opt-in.
            </Text>
            <Field label="Como o AXEL te chama" value={name} onChangeText={setName} placeholder="Seu nome" />
            <Field label="Telefone" value={phone} onChangeText={setPhone} placeholder="(11) 90000-0000" keyboardType="phone-pad" />
            <Field label="Cidade" value={city} onChangeText={setCity} placeholder="São Paulo, Brasil" />
            <Text variant="caption" muted>
              Cor do avatar
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_TINTS.map((tint) => (
                <Pressable
                  key={tint}
                  onPress={() => void patch({ profile_avatar_tint: tint })}
                  accessibilityLabel={`Avatar ${tint}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: tint,
                    borderWidth: avatarTint === tint ? 3 : 0,
                    borderColor: colors.ink,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <PrimaryButton label="Cancelar" variant="ghost" onPress={closeSheet} style={{ flex: 1 }} />
              <PrimaryButton
                label="Salvar"
                style={{ flex: 1 }}
                onPress={() =>
                {
                  void patch({
                    axel_calls_you: name.trim(),
                    display_name: name.trim(),
                    profile_phone: phone.trim(),
                    profile_city: city.trim(),
                  })
                  closeSheet()
                }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'a11y'} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <Card tone="elevated" style={{ gap: space.md, width: '100%', maxWidth: 440 }}>
            <Text variant="section">Acessibilidade</Text>
            {(
              [
                { key: 'a11y_large_text' as const, label: 'Texto maior', hint: 'Aumenta tipografia confortável' },
                { key: 'a11y_reduce_motion' as const, label: 'Reduzir movimento', hint: 'Menos animações e scale' },
                { key: 'a11y_high_contrast' as const, label: 'Alto contraste', hint: 'Bordas e textos mais firmes' },
              ]
            ).map((row) => (
              <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{row.label}</Text>
                  <Text variant="caption" muted>
                    {row.hint}
                  </Text>
                </View>
                <Switch
                  value={Boolean(prefs[row.key])}
                  onValueChange={(v) => void patch({ [row.key]: v })}
                  trackColor={{ false: colors.hairline, true: colors.axel }}
                  thumbColor={colors.surface}
                />
              </View>
            ))}
            <PrimaryButton label="Fechar" variant="dismiss" onPress={closeSheet} />
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'seguranca'} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <View style={{ maxHeight: '85%', width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: 20, padding: space.lg }}>
            <Text variant="section" style={{ marginBottom: space.md }}>
              Segurança
            </Text>
            <MfaEnrollPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={closeSheet} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'circulo'} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <Card tone="elevated" style={{ gap: space.md, width: '100%', maxWidth: 440 }}>
            <Text variant="section">Convite ao Círculo</Text>
            <Text variant="caption" muted>
              Gere um código de 7 dias para um amigo entrar na sua rede.
            </Text>
            {invite ? <Text variant="bodyStrong">{invite}</Text> : null}
            {inviteMsg ? (
              <Text variant="caption" color={colors.axel}>
                {inviteMsg}
              </Text>
            ) : null}
            <PrimaryButton
              label="Gerar convite"
              disabled={isGuest}
              onPress={() =>
              {
                void (async () =>
                {
                  const res = await createFriendInvite(supabase as never, appOrigin())
                  if (!res)
                  {
                    setInviteMsg('Não foi possível gerar. Faça login.')
                    return
                  }
                  setInvite(res.url)
                  setInviteMsg(`Código ${res.code}`)
                })()
              }}
            />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={closeSheet} />
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'xp'} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <View style={{ maxHeight: '85%', width: '100%', maxWidth: 440, backgroundColor: colors.canvas, borderRadius: 20, padding: space.lg }}>
            <GamificationPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={closeSheet} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'admin' && isAdmin} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSheet} />
          <View style={{ maxHeight: '85%', width: '100%', maxWidth: 560, backgroundColor: colors.surface, borderRadius: 20, padding: space.lg }}>
            <AdminUsersPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={closeSheet} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

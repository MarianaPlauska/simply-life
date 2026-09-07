import { useEffect, useState } from 'react'
import { View, Switch, Modal, Pressable } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ShieldCheck } from 'lucide-react-native'
import { createFriendInvite } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Field } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { MfaEnrollPanel } from '../src/components/auth/MfaEnrollPanel'
import { AdminUsersPanel } from '../src/components/auth/AdminUsersPanel'
import { GamificationPanel } from '../src/components/dashboard/GamificationPanel'
import { PersonalSummaryGrid } from '../src/components/dashboard/PersonalSummaryGrid'
import {
  ProfileSection,
  ProfileSettingsRow,
} from '../src/components/profile/ProfileSettingsRow'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { supabase } from '../src/lib/supabase'
import { appOrigin } from '../src/lib/appOrigin'
import { resolveAxelName } from '../src/lib/axelName'

type Sheet = 'nome' | 'a11y' | 'seguranca' | 'circulo' | 'xp' | 'admin' | null

const AVATAR_TINTS = ['#E8734A', '#C45A32', '#F2EDE6', '#A69C8E', '#6B7FD7'] as const

export default function PerfilScreen()
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

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Perfil" subtitle="Conta, acessibilidade e sync" />

      <View style={{ gap: space.lg }}>
        {/* Hero avatar - ref perfil com anel pontilhado suave */}
        <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.sm }}>
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 112,
                height: 112,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: `${avatarTint}55`,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 999,
                  backgroundColor: `${avatarTint}28`,
                  borderWidth: 3,
                  borderColor: avatarTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="hero" style={{ fontSize: 36, color: avatarTint }}>
                  {initial}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setSheet('nome')}
              accessibilityLabel="Editar perfil"
              style={{
                position: 'absolute',
                right: 2,
                bottom: 2,
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.inkMuted} />
            </Pressable>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="title" style={{ fontSize: 22 }}>
              {displayName}
            </Text>
            <Text variant="caption" muted>
              {email ?? (isGuest ? 'Modo convidado' : 'sem e-mail')}
            </Text>
            {isAdmin ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <ShieldCheck size={16} color={colors.axel} />
                <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
                  Administradora
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <PersonalSummaryGrid />

        {/* Dados - prontos para sync nuvem */}
        <ProfileSection title="Dados">
          <ProfileSettingsRow
            icon="mail-outline"
            label="E-mail"
            value={email ?? '-'}
            accent="#6B7FD7"
          />
          <ProfileSettingsRow
            icon="call-outline"
            label="Telefone"
            value={prefs.profile_phone?.trim() || 'Adicionar'}
            accent="#5BA88A"
            onPress={() => setSheet('nome')}
          />
          <ProfileSettingsRow
            icon="calendar-outline"
            label="Data de registro"
            value={memberSince}
            accent="#C4A574"
          />
          <ProfileSettingsRow
            icon="location-outline"
            label="Cidade"
            value={prefs.profile_city?.trim() || 'Adicionar'}
            accent="#E07A6A"
            onPress={() => setSheet('nome')}
          />
          <ProfileSettingsRow
            icon="person-outline"
            label="Como o AXEL te chama"
            value={displayName}
            accent={colors.axel}
            onPress={() => setSheet('nome')}
          />
          <ProfileSettingsRow
            icon="cloud-outline"
            label="Sincronização na nuvem"
            value={prefs.cloud_sync_opt_in ? 'Opt-in' : 'Local'}
            accent="#6B9BD1"
            onPress={() =>
            {
              void patch({ cloud_sync_opt_in: !prefs.cloud_sync_opt_in })
            }}
          />
        </ProfileSection>

        {prefs.cloud_sync_opt_in ? (
          <Card tone="elevated" style={{ borderRadius: 16, gap: 6 }}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Sync preparado
            </Text>
            <Text variant="caption" muted>
              Seus dados de perfil e preferências ficam prontos para sincronizar na nuvem
              quando a fila estiver disponível. Hoje tudo persiste neste aparelho.
            </Text>
          </Card>
        ) : null}

        {/* Configurações */}
        <ProfileSection title="Configurações">
          <ProfileSettingsRow
            icon="accessibility-outline"
            label="Acessibilidade"
            value={
              prefs.a11y_large_text || prefs.a11y_reduce_motion || prefs.a11y_high_contrast
                ? 'Ativa'
                : 'Padrão'
            }
            onPress={() => setSheet('a11y')}
          />
          <ProfileSettingsRow
            icon="shield-checkmark-outline"
            label="Segurança"
            onPress={() => setSheet('seguranca')}
          />
          <ProfileSettingsRow
            icon="color-palette-outline"
            label="Aparência"
            value={mode === 'dark' ? 'Escuro' : 'Claro'}
            onPress={() =>
            {
              const next = mode === 'dark' ? 'light' : 'dark'
              setMode(next)
            }}
          />
          <ProfileSettingsRow
            icon="options-outline"
            label="Preferências"
            onPress={() => router.push('/preferencias')}
          />
          <ProfileSettingsRow
            icon="settings-outline"
            label="Configurações e integrações"
            onPress={() => router.push('/configuracoes')}
          />
          <ProfileSettingsRow
            icon="people-outline"
            label="Círculo"
            onPress={() => setSheet('circulo')}
          />
          <ProfileSettingsRow
            icon="sparkles-outline"
            label="AXEL / XP"
            onPress={() => setSheet('xp')}
          />
          {isAdmin ? (
            <ProfileSettingsRow
              icon="shield-checkmark-outline"
              iconNode={<ShieldCheck size={18} color={colors.axel} />}
              label="Admin"
              value="Usuários"
              onPress={() => setSheet('admin')}
            />
          ) : null}
        </ProfileSection>

        {/* Histórico de atividade */}
        <ProfileSection title="Histórico de atividade">
          {recent.length === 0 ? (
            <Text variant="caption" muted style={{ padding: 12 }}>
              Ainda sem eventos. Complete uma tarefa ou um check-in.
            </Text>
          ) : (
            recent.map((h) => (
              <ProfileSettingsRow
                key={h.id}
                icon="time-outline"
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
          <ProfileSettingsRow
            icon="book-outline"
            label="Ver histórico AXEL"
            onPress={() => router.push('/axel/historico')}
          />
        </ProfileSection>

        <PrimaryButton
          label="Sair da conta"
          variant="ghost"
          onPress={() => void signOut().then(() => router.replace('/login'))}
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* Sheets / modais das seções */}
      <Modal visible={sheet === 'nome'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <Card tone="elevated" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: space.md, paddingBottom: space.xl }}>
            <Text variant="section">Editar dados</Text>
            <Text variant="caption" muted>
              Esses campos ficam locais hoje e entram na fila de sync na nuvem com o opt-in.
            </Text>
            <Field
              label="Como o AXEL te chama"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
            />
            <Field
              label="Telefone"
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 90000-0000"
              keyboardType="phone-pad"
            />
            <Field
              label="Cidade"
              value={city}
              onChangeText={setCity}
              placeholder="São Paulo, Brasil"
            />
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
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: tint,
                    borderWidth: avatarTint === tint ? 3 : 0,
                    borderColor: colors.ink,
                  }}
                />
              ))}
            </View>
            <PrimaryButton
              label="Salvar"
              onPress={() =>
              {
                void patch({
                  axel_calls_you: name.trim(),
                  display_name: name.trim(),
                  profile_phone: phone.trim(),
                  profile_city: city.trim(),
                })
                setSheet(null)
              }}
            />
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'a11y'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <Card tone="elevated" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: space.md, paddingBottom: space.xl }}>
            <Text variant="section">Acessibilidade</Text>
            <Text variant="caption" muted>
              Preferências locais - vão na fila de sync quando a nuvem estiver pronta.
            </Text>
            {(
              [
                {
                  key: 'a11y_large_text' as const,
                  label: 'Texto maior',
                  hint: 'Aumenta tipografia confortável',
                },
                {
                  key: 'a11y_reduce_motion' as const,
                  label: 'Reduzir movimento',
                  hint: 'Menos animações e scale',
                },
                {
                  key: 'a11y_high_contrast' as const,
                  label: 'Alto contraste',
                  hint: 'Bordas e textos mais firmes',
                },
              ]
            ).map((row) => (
              <View
                key={row.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                }}
              >
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
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setSheet(null)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'seguranca'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <Text variant="section" style={{ marginBottom: space.md }}>
              Segurança
            </Text>
            <MfaEnrollPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setSheet(null)} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'circulo'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <Card tone="elevated" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: space.md, paddingBottom: space.xl }}>
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
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setSheet(null)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={sheet === 'xp'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: colors.canvas,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <GamificationPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setSheet(null)} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'admin' && isAdmin} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <AdminUsersPanel />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setSheet(null)} style={{ marginTop: space.md }} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

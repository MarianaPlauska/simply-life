import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { addDaysIso, describeDayPt, localTodayIso } from '@simply-life/shared'
import { Screen, Text, Card, Field, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { SelectChip } from '../src/components/CaptureTaskForm'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { guessCalendarLabel, useCalendarStore } from '../src/store/calendarStore'
import { safeBack } from '../src/lib/safeBack'

type Guide = 'google' | 'teams' | 'outlook' | 'iphone'

const GUIDES: Record<Guide, { label: string; steps: string[]; note?: string }> = {
  google: {
    label: 'Gmail / Google',
    steps: [
      'No computador, abra calendar.google.com.',
      'Clique na engrenagem (Configurações).',
      'Na coluna da esquerda, clique no nome da sua agenda.',
      'Desça até "Integrar agenda".',
      'Copie o "Endereço secreto no formato iCal" e cole aqui embaixo.',
    ],
  },
  teams: {
    label: 'Teams (trabalho)',
    steps: [
      'As reuniões do Teams ficam na agenda do Outlook da empresa.',
      'No computador, abra outlook.office.com com a conta do trabalho.',
      'Configurações (engrenagem) → Calendário → Calendários compartilhados.',
      'Em "Publicar um calendário", escolha "Calendário" e a permissão. "Pode ver quando estou ocupado" já basta: o Axel só precisa dos horários.',
      'Clique em Publicar e copie o link ICS.',
    ],
    note: 'Se "Publicar um calendário" não aparecer, a empresa bloqueou essa opção. Peça ao TI para liberar a publicação de calendário, ou use só a agenda pessoal por enquanto.',
  },
  outlook: {
    label: 'Outlook pessoal',
    steps: [
      'Abra outlook.com no computador.',
      'Configurações → Calendário → Calendários compartilhados.',
      'Em "Publicar um calendário", escolha a agenda e "Pode ver todos os detalhes".',
      'Clique em Publicar e copie o link ICS.',
    ],
  },
  iphone: {
    label: 'iPhone (iCloud)',
    steps: [
      'Abra o app Calendário e toque em "Calendários".',
      'Toque no (i) ao lado da agenda.',
      'Ative "Calendário Público" e toque em "Compartilhar link".',
      'Copie o link (começa com webcal://) e cole aqui.',
    ],
  },
}

const LABEL_SUGGESTIONS = ['Gmail', 'Teams', 'Trabalho', 'Pessoal', 'Faculdade']

/** Conectar agendas de graça: várias ao mesmo tempo (ex.: Gmail + Teams). */
export default function AgendaScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const sources = useCalendarStore((s) => s.sources)
  const bySource = useCalendarStore((s) => s.bySource)
  const events = useCalendarStore((s) => s.events)
  const syncedAt = useCalendarStore((s) => s.syncedAt)
  const syncing = useCalendarStore((s) => s.syncing)
  const error = useCalendarStore((s) => s.error)
  const sourceErrors = useCalendarStore((s) => s.sourceErrors)
  const hydrate = useCalendarStore((s) => s.hydrate)
  const connectIcs = useCalendarStore((s) => s.connectIcs)
  const connectGoogle = useCalendarStore((s) => s.connectGoogle)
  const refresh = useCalendarStore((s) => s.refresh)
  const removeSource = useCalendarStore((s) => s.removeSource)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [guide, setGuide] = useState<Guide>('google')
  const [adding, setAdding] = useState(false)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const showForm = adding || sources.length === 0
  const today = localTodayIso()
  const upcoming = useMemo(
    () => events.filter((e) => e.date >= today && e.date <= addDaysIso(today, 6)).slice(0, 10),
    [events, today],
  )
  const hhmm = (m: number | null) => (m == null ? 'dia inteiro' : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)

  const onConnect = async () =>
  {
    const ok = await connectIcs(url, label || guessCalendarLabel(url))
    if (ok)
    {
      setUrl('')
      setLabel('')
      setAdding(false)
    }
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Suas agendas" subtitle="O Axel junta todas e encaixa as tarefas nos horários livres" />
      <View style={{ gap: space.md }}>
        {sources.length ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">Conectadas</Text>
            {sources.map((s) => (
              <View key={s.id} style={{ gap: 2, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={sourceErrors[s.id] ? 'alert-circle-outline' : 'checkmark-circle'}
                    size={18}
                    color={sourceErrors[s.id] ? colors.attention : colors.axel}
                  />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>{s.label}</Text>
                  <Text variant="caption" muted>{(bySource[s.id] ?? []).length} eventos</Text>
                  <Pressable onPress={() => void removeSource(s.id)} accessibilityRole="button" accessibilityLabel={`Remover ${s.label}`} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.inkMuted} />
                  </Pressable>
                </View>
                {sourceErrors[s.id] ? <Text variant="caption" color={colors.attention}>{sourceErrors[s.id]}</Text> : null}
              </View>
            ))}
            <Text variant="caption" muted>
              {syncedAt ? `Atualizadas às ${new Date(syncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. ` : ''}
              Atualizam sozinhas a cada 30 min. O mesmo compromisso em duas agendas aparece uma vez só.
            </Text>
            {upcoming.map((e) => (
              <Text key={e.id} variant="body" style={{ fontSize: 14 }}>
                · {describeDayPt(e.date)} {hhmm(e.inicio)} · {e.titulo}
                {sources.length > 1 && e.origem ? ` (${e.origem})` : ''}{e.busy ? '' : ' · livre'}
              </Text>
            ))}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton label="Atualizar agora" variant="secondary" size="sm" loading={syncing} onPress={() => void refresh(true)} style={{ flex: 1 }} />
              {!showForm ? (
                <PrimaryButton label="Adicionar outra" size="sm" onPress={() => setAdding(true)} style={{ flex: 1 }} />
              ) : null}
            </View>
          </Card>
        ) : null}

        {showForm ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">{sources.length ? 'Adicionar outra agenda' : 'Conectar pelo endereço iCal'}</Text>
            <Text variant="caption" muted>
              Grátis. É só leitura: o Axel vê os horários e não muda nada na sua agenda. O endereço fica guardado só neste aparelho.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(GUIDES) as Guide[]).map((g) => (
                <SelectChip key={g} label={GUIDES[g].label} active={guide === g} onPress={() => setGuide(g)} />
              ))}
            </View>
            {GUIDES[guide].steps.map((step, i) => (
              <View key={step} style={{ flexDirection: 'row', gap: 8 }}>
                <Text variant="bodyStrong" style={{ width: 18 }}>{i + 1}.</Text>
                <Text variant="body" style={{ flex: 1, fontSize: 14 }}>{step}</Text>
              </View>
            ))}
            {GUIDES[guide].note ? (
              <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.hairline }}>
                <Ionicons name="information-circle-outline" size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
                <Text variant="caption" style={{ flex: 1 }}>{GUIDES[guide].note}</Text>
              </View>
            ) : null}
            <Field
              tone="sand"
              label="Endereço da agenda"
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect={false}
              value={url}
              onChangeText={setUrl}
            />
            <Text variant="caption" muted>Nome para reconhecer</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LABEL_SUGGESTIONS.map((l) => (
                <SelectChip key={l} label={l} active={label === l} onPress={() => setLabel(label === l ? '' : l)} />
              ))}
            </View>
            <Text variant="micro" muted>
              Esse endereço dá acesso de leitura à agenda: não compartilhe com ninguém.
            </Text>
            {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
            <PrimaryButton label="Conectar agenda" loading={syncing} disabled={url.trim().length < 12} onPress={() => void onConnect()} />
            {sources.length ? (
              <PrimaryButton label="Cancelar" variant="ghost" size="sm" onPress={() => setAdding(false)} />
            ) : null}
          </Card>
        ) : null}

        {!isGuest && !sources.some((s) => s.kind === 'google') ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">Ou use sua conta Google</Text>
            <Text variant="caption" muted>
              Se você já conectou o Google em Configurações (Gmail), o Axel pode ler a agenda por lá, também de graça.
            </Text>
            <PrimaryButton label="Usar minha conta Google" variant="secondary" loading={syncing} onPress={() => void connectGoogle()} />
          </Card>
        ) : null}

        <PrimaryButton label="Voltar" variant="ghost" onPress={() => safeBack(router, '/(tabs)')} />
      </View>
    </Screen>
  )
}

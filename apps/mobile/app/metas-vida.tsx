import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { localTodayIso, pledgeProgress } from '@simply-life/shared'
import { Field, PrimaryButton, Screen, Text } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useLifePledgeStore } from '../src/store/lifePledgeStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { MAX_DASHBOARD_WIDGETS, resolveDashboardWidgets } from '../src/lib/dashboardWidgets'

const IDEAS = [
  { title: 'Um ano sem beber', days: 365 },
  { title: 'Noventa dias sem fumar', days: 90 },
  { title: 'Um mês sem delivery', days: 30 },
]

const SPANS = [30, 90, 365]

export default function MetasVidaScreen()
{
  const { colors, space } = useTheme()
  const pledges = useLifePledgeStore((s) => s.pledges)
  const add = useLifePledgeStore((s) => s.add)
  const restart = useLifePledgeStore((s) => s.restart)
  const remove = useLifePledgeStore((s) => s.remove)
  const pin = useLifePledgeStore((s) => s.pin)
  const prefs = usePrefsStore((s) => s.prefs)
  const toggleWidget = usePrefsStore((s) => s.toggleWidget)
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(365)
  const today = localTodayIso()
  const widgets = resolveDashboardWidgets(
    prefs.dashboard_quick_widgets,
    prefs.dashboard_priority,
    prefs.home_module_order,
  )
  const onHome = widgets.includes('life_pledge')
  const homeFull = widgets.length >= MAX_DASHBOARD_WIDGETS && !onHome

  return (
    <Screen scroll>
      <StackHeader title="Metas importantes" />
      <Text variant="body" muted>
        Uma meta longa conta os dias a partir de hoje. Um ano sem beber, por exemplo. A faixa enche sozinha.
      </Text>

      <View style={{ gap: space.sm, marginTop: space.md }}>
        <Field
          label="O que você quer sustentar"
          value={title}
          onChangeText={setTitle}
          placeholder="Um ano sem beber"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SPANS.map((n) =>
          {
            const on = days === n
            return (
              <Pressable
                key={n}
                onPress={() => setDays(n)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.health : 'transparent',
                  borderWidth: 1,
                  borderColor: on ? colors.health : colors.hairline,
                }}
              >
                <Text variant="caption" style={{ color: on ? colors.canvas : colors.ink }}>{n} dias</Text>
              </Pressable>
            )
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {IDEAS.map((idea) => (
            <Pressable
              key={idea.title}
              onPress={() =>
              {
                setTitle(idea.title)
                setDays(idea.days)
              }}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text variant="caption" style={{ color: colors.health }}>{idea.title}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label="Começar a contar"
          disabled={!title.trim()}
          onPress={() =>
          {
            add(title, days)
            setTitle('')
          }}
        />
        <Text variant="caption" muted>
          Se precisar recomeçar, a contagem volta para o dia 1. Isso não tira ponto, moeda nem as outras metas.
        </Text>
      </View>

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <PrimaryButton
          label={onHome ? 'Tirar da Home' : 'Deixar na Home'}
          variant="secondary"
          disabled={homeFull}
          onPress={() => void toggleWidget('life_pledge')}
        />
        <Text variant="caption" muted>
          {homeFull
            ? 'A Home já tem 3 cartões. Tire um em Preferências para abrir espaço.'
            : 'O cartão da Home mostra a meta marcada como widget.'}
        </Text>
      </View>

      <View style={{ marginTop: space.lg, gap: space.md, paddingBottom: 32 }}>
        {pledges.map((pledge) =>
        {
          const progress = pledgeProgress(pledge.startedOn, pledge.targetDays, today)
          const line = progress.complete
            ? `${progress.elapsed} dias. A meta de ${progress.target} já chegou.`
            : `${progress.elapsed} de ${progress.target} dias. Faltam ${progress.left}.`
          return (
            <View key={pledge.id} style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 16 }}>
              <Text variant="body">{pledge.title}</Text>
              <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
                <View style={{ width: `${progress.pct}%`, height: '100%', backgroundColor: colors.health }} />
              </View>
              <Text variant="caption" muted>{line}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <Pressable onPress={() => pin(pledge.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: colors.health }}>
                    {pledge.pinned ? 'No widget' : 'Colocar no widget'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => restart(pledge.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: colors.inkMuted }}>Recomeçar</Text>
                </Pressable>
                <Pressable onPress={() => remove(pledge.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: colors.inkMuted }}>Apagar</Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}

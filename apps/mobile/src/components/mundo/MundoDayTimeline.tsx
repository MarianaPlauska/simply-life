import { Fragment } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { minutesToLabel, todayIso, type BlocoOcorrencia, type CalendarEvent } from '@simply-life/shared'
import { Icon, PressableScale, SwipeRow, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useMeuMundoStore } from '../../store/meuMundoStore'
import { blocoColor } from './mundoColors'

type Props = {
  dia: string
  ocorrencias: BlocoOcorrencia[]
  events: CalendarEvent[]
  onPressBloco: (o: BlocoOcorrencia) => void
}

function gapLabel(min: number): string
{
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? (m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`) : `${m} min`
}

/** O dia como linha do tempo: blocos coloridos, tempo livre entre eles e um traço no agora. */
export function MundoDayTimeline({ dia, ocorrencias, events, onPressBloco }: Props)
{
  const { colors, chart, space } = useTheme()
  const mark = useMeuMundoStore((s) => s.mark)
  const isToday = dia === todayIso()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const semHora = ocorrencias.filter((o) => o.inicio == null)
  const dayEvents = events.filter((e) => e.date === dia)
  type Item = { start: number; end: number; o?: BlocoOcorrencia; e?: CalendarEvent }
  const comHora: Item[] = [
    ...ocorrencias.filter((o) => o.inicio != null).map((o) => ({ start: o.inicio!, end: o.fim!, o })),
    ...dayEvents.filter((e) => !e.allDay && e.inicio != null).map((e) => ({ start: e.inicio!, end: e.fim ?? e.inicio!, e })),
  ].sort((a, b) => a.start - b.start)
  let nowShown = !isToday

  const nowLine = (
    <View key="now" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
      <Text variant="micro" color={colors.danger} style={{ width: 44 }}>{minutesToLabel(nowMin)}</Text>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
      <View style={{ flex: 1, height: 2, backgroundColor: colors.danger }} />
    </View>
  )

  const row = (o: BlocoOcorrencia) =>
  {
    const color = blocoColor(o.bloco, chart, colors.axel)
    const done = o.status === 'feito'
    const skipped = o.status === 'pulado'
    return (
      <SwipeRow
        key={o.bloco.id}
        left={{ label: done ? 'Reabrir' : 'Feito', icon: 'checkmark', color: colors.health, onPress: () => void mark(o.bloco.id, dia, { status: done ? null : 'feito' }) }}
        right={{ label: skipped ? 'Voltar' : 'Pular hoje', icon: 'return-down-forward', color: colors.inkMuted, onPress: () => void mark(o.bloco.id, dia, { status: skipped ? null : 'pulado' }) }}
      >
        <Pressable
          onPress={() => onPressBloco(o)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 64,
            paddingVertical: 8,
            backgroundColor: pressed ? colors.fill : 'transparent',
            opacity: skipped ? 0.45 : 1,
          })}
        >
          <Text variant="caption" muted style={{ width: 44 }}>{o.inicio != null ? minutesToLabel(o.inicio) : ''}</Text>
          <View
            style={{
              width: 44,
              height: Math.max(44, Math.min(120, (o.bloco.duracaoMinutos / 60) * 56)),
              borderRadius: 22,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={o.bloco.repete === 'nao' ? 'ellipse' : 'repeat'} size={18} color={'#FFFFFF'} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              variant="body"
              numberOfLines={2}
              style={{ fontWeight: '600', textDecorationLine: done || skipped ? 'line-through' : 'none', color: done ? colors.inkMuted : colors.ink }}
            >
              {o.bloco.titulo}
            </Text>
            <Text variant="caption" muted numberOfLines={1}>
              {[
                o.inicio != null && o.fim != null ? `${minutesToLabel(o.inicio)} às ${minutesToLabel(o.fim)}` : 'Sem hora',
                o.bloco.tipo === 'flexivel' ? 'flexível' : null,
                skipped ? 'pulado hoje' : null,
              ].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <PressableScale
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={done ? 'Desmarcar' : 'Marcar como feito'}
            onPress={() => void mark(o.bloco.id, dia, { status: done ? null : 'feito' })}
            hitSlop={10}
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              borderWidth: done ? 0 : 2,
              borderColor: color,
              backgroundColor: done ? colors.health : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {done ? <Icon name="checkmark" size={16} color={colors.canvas} /> : null}
          </PressableScale>
        </Pressable>
      </SwipeRow>
    )
  }

  const eventRow = (e: CalendarEvent) => (
    <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 }}>
      <Text variant="caption" muted style={{ width: 44 }}>{e.inicio != null ? minutesToLabel(e.inicio) : ''}</Text>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="calendar-outline" size={18} color={colors.inkMuted} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body" numberOfLines={2} style={{ fontWeight: '600' }}>{e.titulo}</Text>
        <Text variant="caption" muted numberOfLines={1}>
          {[e.inicio != null && e.fim != null ? `${minutesToLabel(e.inicio)} às ${minutesToLabel(e.fim)}` : 'Dia inteiro', e.origem ?? 'agenda'].join(' · ')}
        </Text>
      </View>
    </View>
  )

  if (!ocorrencias.length && !dayEvents.length)
  {
    return (
      <View style={{ paddingVertical: space.xl, alignItems: 'center', gap: space.sm }}>
        <Icon name="sunny-outline" size={28} color={colors.inkFaint} />
        <Text variant="body" muted style={{ textAlign: 'center' }}>Dia livre. Toque no + para colocar algo.</Text>
      </View>
    )
  }

  return (
    <View>
      {semHora.length ? (
        <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, marginBottom: space.sm }}>
          <Text variant="micro" muted>QUALQUER HORA</Text>
          {semHora.map(row)}
        </View>
      ) : null}
      {dayEvents.filter((e) => e.allDay).map(eventRow)}
      {comHora.map((it, i) =>
      {
        const prev = comHora[i - 1]
        const gap = prev ? it.start - Math.max(...comHora.slice(0, i).map((p) => p.end)) : 0
        const showNow = !nowShown && nowMin < it.start
        if (showNow) nowShown = true
        return (
          <Fragment key={`${it.o?.bloco.id ?? it.e?.id}-${i}`}>
            {gap >= 30 && !showNow ? (
              <Text variant="micro" muted style={{ paddingLeft: 56, paddingVertical: 2 }}>Livre {gapLabel(gap)}</Text>
            ) : null}
            {showNow ? nowLine : null}
            {it.o ? row(it.o) : eventRow(it.e!)}
          </Fragment>
        )
      })}
      {!nowShown ? nowLine : null}
    </View>
  )
}

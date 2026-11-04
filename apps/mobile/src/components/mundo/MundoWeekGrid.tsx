import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { addDaysToIso, todayIso, type BlocoOcorrencia, type CalendarEvent } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { hapticSelect } from '../../lib/haptics'
import { blocoColor } from './mundoColors'

const START = 6
const END = 23
const ROW = 48
const HOUR_COL = 34
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const SNAP = 15

type Props = {
  monday: string
  ocorrencias: BlocoOcorrencia[]
  events: CalendarEvent[]
  onPressSlot: (dia: string, hora: number) => void
  onPressBloco: (o: BlocoOcorrencia) => void
  onPressDay: (dia: string) => void
  onMove: (o: BlocoOcorrencia, dia: string, hora: number) => void
  onResize: (o: BlocoOcorrencia, duracao: number) => void
}

type Drag = { key: string; mode: 'move' | 'resize'; dx: number; dy: number }

const toY = (min: number) => ((min - START * 60) / 60) * ROW
const snapMin = (dy: number) => Math.round(((dy / ROW) * 60) / SNAP) * SNAP

function GridBloco({
  o,
  colW,
  drag,
  setDrag,
  onPress,
  onMove,
  onResize,
}: {
  o: BlocoOcorrencia
  colW: number
  drag: Drag | null
  setDrag: (d: Drag | null) => void
  onPress: () => void
  onMove: (dayDelta: number, minDelta: number) => void
  onResize: (minDelta: number) => void
})
{
  const { colors, chart } = useTheme()
  const key = `${o.bloco.id}|${o.dia}`
  const mine = drag?.key === key ? drag : null
  const top = toY(Math.max(o.inicio!, START * 60))
  const baseH = toY(Math.min(o.fim!, END * 60)) - top - 2
  const height = Math.max(18, mine?.mode === 'resize' ? baseH + mine.dy : baseH)
  const color = blocoColor(o.bloco, chart, colors.axel)

  const move = Gesture.Pan()
    .activateAfterLongPress(250)
    .runOnJS(true)
    .onStart(() =>
    {
      hapticSelect()
      setDrag({ key, mode: 'move', dx: 0, dy: 0 })
    })
    .onUpdate((e) => setDrag({ key, mode: 'move', dx: e.translationX, dy: e.translationY }))
    .onEnd((e) => onMove(colW ? Math.round(e.translationX / colW) : 0, snapMin(e.translationY)))
    .onFinalize(() => setDrag(null))
  const tap = Gesture.Tap().runOnJS(true).onEnd((_e, ok) =>
  {
    if (ok) onPress()
  })
  const resize = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .runOnJS(true)
    .onStart(() => setDrag({ key, mode: 'resize', dx: 0, dy: 0 }))
    .onUpdate((e) => setDrag({ key, mode: 'resize', dx: 0, dy: e.translationY }))
    .onEnd((e) => onResize(snapMin(e.translationY)))
    .onFinalize(() => setDrag(null))

  return (
    <GestureDetector gesture={Gesture.Exclusive(move, tap)}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={o.bloco.titulo}
        accessibilityHint="Toque para editar. Segure e arraste para mudar o horário."
        style={{
          position: 'absolute',
          top,
          left: 1,
          right: 1,
          height,
          borderRadius: 6,
          paddingHorizontal: 3,
          paddingTop: 2,
          overflow: 'hidden',
          backgroundColor: color,
          opacity: o.status === 'pulado' ? 0.35 : o.status === 'feito' ? 0.6 : 1,
          borderStyle: o.bloco.tipo === 'flexivel' ? 'dashed' : 'solid',
          borderWidth: o.bloco.tipo === 'flexivel' ? 1 : 0,
          borderColor: colors.canvas,
          zIndex: mine ? 10 : 1,
          transform: mine?.mode === 'move' ? [{ translateX: mine.dx }, { translateY: mine.dy }, { scale: 1.04 }] : [],
          shadowColor: '#000',
          shadowOpacity: mine ? 0.3 : 0,
          shadowRadius: 8,
          elevation: mine ? 6 : 0,
        }}
      >
        <Text variant="micro" color={'#FFFFFF'} numberOfLines={1} style={{ fontWeight: '600' }}>
          {o.bloco.titulo}
        </Text>
        <GestureDetector gesture={resize}>
          <View
            accessibilityLabel="Puxe para mudar a duração"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2 }}
          >
            <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' }} />
          </View>
        </GestureDetector>
      </View>
    </GestureDetector>
  )
}

/** A "planilha" da semana: dias nas colunas, horas nas linhas. Segure um bloco para arrastar; puxe a borda de baixo para mudar a duração. */
export function MundoWeekGrid({ monday, ocorrencias, events, onPressSlot, onPressBloco, onPressDay, onMove, onResize }: Props)
{
  const { colors, chart } = useTheme()
  const [colW, setColW] = useState(0)
  const [drag, setDrag] = useState<Drag | null>(null)
  const today = todayIso()
  const dias = SEMANA.map((_, i) => addDaysToIso(monday, i))
  const hours = Array.from({ length: END - START }, (_, i) => START + i)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const semHora = ocorrencias.filter((o) => o.inicio == null)
  const inRange = (s: number | null, e: number | null) => s != null && e != null && e > START * 60 && s < END * 60

  return (
    <View>
      <View style={{ flexDirection: 'row', paddingLeft: HOUR_COL }}>
        {dias.map((dia, i) =>
        {
          const isToday = dia === today
          return (
            <Pressable key={dia} onPress={() => onPressDay(dia)} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, gap: 2 }}>
              <Text variant="micro" muted>{SEMANA[i]}</Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? colors.axel : 'transparent',
                }}
              >
                <Text variant="label" color={isToday ? colors.canvas : colors.ink}>{Number(dia.slice(8))}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {semHora.length ? (
        <View style={{ flexDirection: 'row', paddingLeft: HOUR_COL, paddingBottom: 4 }}>
          {dias.map((dia) => (
            <View key={dia} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              {semHora.filter((o) => o.dia === dia).slice(0, 3).map((o) => (
                <Pressable
                  key={o.bloco.id}
                  onPress={() => onPressBloco(o)}
                  accessibilityLabel={o.bloco.titulo}
                  style={{ width: '90%', height: 6, borderRadius: 3, backgroundColor: blocoColor(o.bloco, chart, colors.axel) }}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row' }} onLayout={(e) => setColW((e.nativeEvent.layout.width - HOUR_COL) / 7)}>
        <View style={{ width: HOUR_COL }}>
          {hours.map((h) => (
            <View key={h} style={{ height: ROW }}>
              <Text variant="micro" muted style={{ marginTop: -7 }}>{String(h).padStart(2, '0')}h</Text>
            </View>
          ))}
        </View>
        {dias.map((dia, di) => (
          <View
            key={dia}
            style={{
              flex: 1,
              height: hours.length * ROW,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderLeftColor: colors.hairline,
              backgroundColor: dia === today ? colors.fill : 'transparent',
              zIndex: drag?.key.endsWith(`|${dia}`) ? 5 : 0,
            }}
          >
            <Pressable
              accessibilityLabel={`Criar bloco em ${dia}`}
              onPress={(e) =>
              {
                const slot = Math.floor(e.nativeEvent.locationY / (ROW / 2)) * 30
                onPressSlot(dia, Math.min(END * 60 - 30, START * 60 + slot))
              }}
              style={StyleSheet.absoluteFill}
            />
            {hours.map((h) => (
              <View
                key={h}
                pointerEvents="none"
                style={{ position: 'absolute', top: (h - START) * ROW, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline }}
              />
            ))}
            {events
              .filter((e) => e.date === dia && !e.allDay && inRange(e.inicio, e.fim))
              .map((e) => (
                <View
                  key={e.id}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: toY(Math.max(e.inicio!, START * 60)),
                    height: Math.max(16, toY(Math.min(e.fim!, END * 60)) - toY(Math.max(e.inicio!, START * 60)) - 2),
                    left: 1,
                    right: 1,
                    borderRadius: 6,
                    paddingHorizontal: 3,
                    paddingTop: 2,
                    overflow: 'hidden',
                    backgroundColor: colors.elevated,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.inkFaint,
                  }}
                >
                  <Text variant="micro" muted numberOfLines={1}>{e.titulo}</Text>
                </View>
              ))}
            {ocorrencias
              .filter((o) => o.dia === dia && inRange(o.inicio, o.fim))
              .map((o) => (
                <GridBloco
                  key={o.bloco.id}
                  o={o}
                  colW={colW}
                  drag={drag}
                  setDrag={setDrag}
                  onPress={() => onPressBloco(o)}
                  onMove={(dayDelta, minDelta) =>
                  {
                    if (!dayDelta && !minDelta) return
                    const d = Math.max(0, Math.min(6, di + dayDelta))
                    const hora = Math.max(0, Math.min(24 * 60 - o.bloco.duracaoMinutos, o.inicio! + minDelta))
                    onMove(o, dias[d], hora)
                  }}
                  onResize={(minDelta) =>
                  {
                    if (minDelta) onResize(o, Math.max(SNAP, o.bloco.duracaoMinutos + minDelta))
                  }}
                />
              ))}
            {dia === today && nowMin >= START * 60 && nowMin < END * 60 ? (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: toY(nowMin), left: 0, right: 0, height: 2, backgroundColor: colors.danger }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}

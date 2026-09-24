import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatMinutesPt, nowAndNext, type DayBlock } from '@simply-life/shared'
import { Card, Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCalendarStore } from '../../store/calendarStore'
import { useNeuroStore } from '../../store/neuroStore'
import { useMinuteClock, useVisualDay } from '../../hooks/useTodayVisualDay'

const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

const KIND_META: Record<DayBlock['kind'], { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  agenda: { icon: 'calendar-outline', label: 'Agenda' },
  compromisso: { icon: 'time-outline', label: 'Horário marcado' },
  tarefa: { icon: 'ellipse-outline', label: 'Sugerido pelo Axel' },
  pausa: { icon: 'cafe-outline', label: 'Pausa' },
}

/**
 * "Agora e depois" (estilo Tiimo): o que é agora, com tempo restante visível,
 * as próximas poucas coisas e o dia inteiro em blocos. Poucas coisas por vez
 * (perfil) para não travar; nada de vermelho; horários sugeridos marcados como tal.
 */
export function VisualDayCard()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const now = useMinuteClock()
  const day = useVisualDay(undefined, now)
  const maxVisible = useNeuroStore((s) => s.maxVisibleTasks)
  const source = useCalendarStore((s) => s.source)
  const [expanded, setExpanded] = useState(false)
  const nn = nowAndNext(day, now, maxVisible)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const nothing = !day.blocks.length && !day.allDay.length && !day.unplaced.length
  if (nothing && source) return null

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="section" style={{ flex: 1 }}>Agora e depois</Text>
        {source ? (
          <Text variant="micro" muted>Agenda conectada</Text>
        ) : (
          <Pressable onPress={() => router.push('/agenda')} accessibilityRole="button" hitSlop={8}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>Conectar agenda</Text>
          </Pressable>
        )}
      </View>

      {day.allDay.length ? (
        <Text variant="caption" muted>Hoje: {day.allDay.map((e) => e.titulo).join(' · ')}</Text>
      ) : null}

      {nn.now ? (
        <NowBlock
          block={nn.now}
          nowMin={nowMin}
          onStart={nn.now.taskId ? () => router.push(`/foco?taskId=${nn.now!.taskId}`) : undefined}
        />
      ) : (
        <View style={{ gap: 4 }}>
          <Text variant="bodyStrong">
            {nn.next[0] ? `Livre até ${hhmm(nn.next[0].inicio)}` : nothing ? 'Nada marcado para hoje' : 'Nada mais marcado hoje'}
          </Text>
          {nn.next[0] && nn.minutesToNext != null ? (
            <Text variant="caption" muted>
              Próximo em {formatMinutesPt(nn.minutesToNext)}: {nn.next[0].titulo}
            </Text>
          ) : null}
        </View>
      )}

      {nn.next.length ? (
        <View style={{ gap: 6 }}>
          <Text variant="caption" muted>Depois</Text>
          {nn.next.map((b) => <BlockRow key={b.id} block={b} compact />)}
        </View>
      ) : null}

      {expanded ? (
        <View style={{ gap: 6, paddingTop: 4 }}>
          <Text variant="caption" muted>O dia todo (horários do Axel são sugestão)</Text>
          {day.blocks.map((b, i) =>
          {
            const showNowLine = b.inicio > nowMin && (i === 0 || day.blocks[i - 1].inicio <= nowMin)
            return (
              <View key={b.id} style={{ gap: 6 }}>
                {showNowLine ? <NowLine nowMin={nowMin} /> : null}
                <BlockRow block={b} past={b.fim <= nowMin} />
              </View>
            )
          })}
        </View>
      ) : null}

      {day.unplaced.length ? (
        <Text variant="caption" muted>
          Não coube hoje, e tudo bem: {day.unplaced.map((u) => u.titulo).join(', ')}.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {day.blocks.length ? (
          <PrimaryButton
            label={expanded ? 'Mostrar menos' : 'Ver o dia todo'}
            variant="ghost"
            size="sm"
            onPress={() => setExpanded(!expanded)}
          />
        ) : null}
        {!source ? (
          <PrimaryButton label="Encaixar com minha agenda" variant="ghost" size="sm" onPress={() => router.push('/agenda')} />
        ) : null}
        <PrimaryButton label="Ajustar ao meu jeito" variant="ghost" size="sm" onPress={() => router.push('/meu-jeito')} />
      </View>
    </Card>
  )
}

function NowBlock({ block, nowMin, onStart }: { block: DayBlock; nowMin: number; onStart?: () => void })
{
  const { colors } = useTheme()
  const total = Math.max(1, block.fim - block.inicio)
  const done = Math.min(1, Math.max(0, (nowMin - block.inicio) / total))
  const left = Math.max(0, block.fim - nowMin)
  const meta = KIND_META[block.kind]
  return (
    <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: block.kind === 'tarefa' ? colors.axelMuted : colors.hairline }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={meta.icon} size={18} color={colors.ink} />
        <Text variant="caption" muted style={{ flex: 1 }}>Agora · {meta.label}</Text>
        <Text variant="caption" muted>{hhmm(block.inicio)}–{hhmm(block.fim)}</Text>
      </View>
      <Text variant="title" style={{ fontSize: 20 }}>{block.titulo}</Text>
      {/* tempo visível (cegueira temporal): barra que enche + minutos restantes em texto */}
      <View
        accessibilityLabel={`Restam ${left} minutos`}
        style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' }}
      >
        <View style={{ width: `${Math.round(done * 100)}%`, height: 8, borderRadius: 4, backgroundColor: colors.axel }} />
      </View>
      <Text variant="bodyStrong" style={{ fontSize: 14 }}>Restam {formatMinutesPt(left)}</Text>
      {onStart ? <PrimaryButton label="Começar com timer" size="sm" onPress={onStart} /> : null}
    </View>
  )
}

function BlockRow({ block, compact, past }: { block: DayBlock; compact?: boolean; past?: boolean })
{
  const { colors } = useTheme()
  const meta = KIND_META[block.kind]
  const isTask = block.kind === 'tarefa'
  const isPause = block.kind === 'pausa'
  const minutes = block.fim - block.inicio
  const height = compact ? undefined : Math.max(40, Math.min(110, minutes * 0.9))
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: compact ? 'center' : 'flex-start',
        minHeight: compact ? 40 : height,
        opacity: past ? 0.45 : block.soft ? 0.7 : 1,
      }}
    >
      <Text variant="caption" muted style={{ width: 42, paddingTop: compact ? 0 : 6 }}>{hhmm(block.inicio)}</Text>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 12,
          minHeight: compact ? 40 : height,
          backgroundColor: isPause ? 'transparent' : isTask ? colors.axelMuted : colors.hairline,
          borderLeftWidth: isPause ? 0 : 3,
          borderLeftColor: isTask ? colors.axel : colors.inkFaint,
        }}
      >
        <Ionicons name={block.essential ? 'star' : meta.icon} size={15} color={isPause ? colors.inkMuted : colors.ink} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant={isPause ? 'caption' : 'bodyStrong'} muted={isPause} style={{ fontSize: 14 }} numberOfLines={2}>
            {block.titulo}
          </Text>
          {!compact && !isPause ? (
            <Text variant="micro" muted>
              {block.origem ? `${meta.label} ${block.origem}` : meta.label}{block.soft ? ' · marcado como livre' : ''} · {formatMinutesPt(minutes)}{block.local ? ` · ${block.local}` : ''}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function NowLine({ nowMin }: { nowMin: number })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`Agora, ${hhmm(nowMin)}`}>
      <Text variant="micro" color={colors.axel} style={{ width: 42, fontWeight: '700' }}>{hhmm(nowMin)}</Text>
      <View style={{ flex: 1, height: 2, backgroundColor: colors.axel, borderRadius: 1 }} />
    </View>
  )
}

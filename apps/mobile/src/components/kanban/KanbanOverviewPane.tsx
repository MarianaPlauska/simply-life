import { useMemo } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  minutesToLabel,
  partitionTodayTimeline,
  classifyDueBucket,
  inferLifeCategory,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'
import { usePrefsStore } from '../../store/prefsStore'

type Props = { tasks: MobileTask[] }

type OverviewTile = {
  id: string
  label: string
  value: number
  color: string
  bg: string
  icon: keyof typeof Ionicons.glyphMap
  href?: string
}

/**
 * Overview Kanban - tiles pastéis + projetos + tarefas de hoje (ref 2ª imagem).
 */
export function KanbanOverviewPane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const displayName = usePrefsStore((s) =>
    s.prefs.axel_calls_you || s.prefs.display_name || 'você',
  )

  const today = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const open = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])
  const overdue = useMemo(
    () => open.filter((t) => classifyDueBucket(t.dataVencimento, t.status) === 'vencido'),
    [open],
  )
  const week = useMemo(
    () => open.filter((t) => classifyDueBucket(t.dataVencimento, t.status) === 'esta_semana'),
    [open],
  )

  const tiles: OverviewTile[] = [
    {
      id: 'today',
      label: 'Hoje',
      value: today.length,
      color: '#5B6BC6',
      bg: '#E8EAF8',
      icon: 'pulse-outline',
    },
    {
      id: 'schedule',
      label: 'Agenda',
      value: week.length,
      color: '#C4784A',
      bg: '#F7E8DC',
      icon: 'trending-up-outline',
      href: '/calendario',
    },
    {
      id: 'overdue',
      label: 'Atrasadas',
      value: overdue.length,
      color: '#4A8BC8',
      bg: '#E3F0FA',
      icon: 'git-branch-outline',
    },
    {
      id: 'all',
      label: 'Todas',
      value: open.length,
      color: '#3F9A78',
      bg: '#E3F5EE',
      icon: 'checkbox-outline',
    },
  ]

  const projects = useMemo(() =>
  {
    const buckets: Record<string, MobileTask[]> = {
      importante: [],
      saude: [],
      crescimento: [],
      carreira: [],
    }
    for (const t of open)
    {
      const cat = inferLifeCategory(t)
      if (!buckets[cat]) buckets[cat] = []
      buckets[cat].push(t)
    }
    return Object.entries(buckets)
      .filter(([, list]) => list.length > 0)
      .map(([id, list]) => ({
        id,
        title:
          id === 'importante'
            ? 'Importante'
            : id === 'saude'
              ? 'Saúde'
              : id === 'crescimento'
                ? 'Crescimento'
                : 'Carreira',
        count: list.length,
        sample: list[0],
      }))
  }, [open])

  return (
    <View style={{ gap: space.lg }}>
      {/* Header Welcome - ref Overview */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: colors.axelMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyStrong" color={colors.axel}>
            {displayName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted>
            Welcome
          </Text>
          <Text variant="section" style={{ fontSize: 18 }}>
            {displayName}
          </Text>
        </View>
        <PressableScale
          accessibilityLabel="Notificações"
          onPress={() => router.push('/perfil')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.inkMuted} />
        </PressableScale>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section" style={{ fontSize: 20, letterSpacing: -0.3 }}>
          Overview
        </Text>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <Text variant="caption" muted>
            Esta semana
          </Text>
        </View>
      </View>

      {/* Grid 2×2 tiles pastéis */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() =>
            {
              if (tile.href) router.push(tile.href as never)
            }}
            style={{
              width: '47%',
              flexGrow: 1,
              minWidth: 140,
              borderRadius: 22,
              backgroundColor: tile.bg,
              padding: space.md,
              gap: 14,
              minHeight: 108,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text
                variant="hero"
                style={{ fontSize: 30, color: tile.color, letterSpacing: -1.2, fontWeight: '700' }}
              >
                {tile.value}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={tile.color} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="caption" style={{ color: tile.color, fontWeight: '700', fontSize: 13 }}>
                {tile.label}
              </Text>
              <Ionicons name={tile.icon} size={18} color={tile.color} style={{ opacity: 0.85 }} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Projetos / pilares */}
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="section" style={{ fontSize: 17 }}>
            Projetos
          </Text>
          <Text variant="caption" muted>
            Todos
          </Text>
        </View>
        {projects.length === 0 ? (
          <EmptyState title="Sem projetos abertos" body="Capture uma tarefa para começar." />
        ) : (
          projects.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => p.sample && router.push(`/task/${p.sample.id}`)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: space.md,
                gap: 8,
                shadowColor: '#1A1208',
                shadowOpacity: 0.05,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" muted>
                  {p.count} tarefa{p.count === 1 ? '' : 's'}
                </Text>
                <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                  Abrir
                </Text>
              </View>
              <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                {p.title}
              </Text>
              {p.sample ? (
                <Text variant="caption" muted numberOfLines={1}>
                  Próxima: {p.sample.titulo}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </View>

      {/* Today's tasks */}
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="section" style={{ fontSize: 17 }}>
            Tarefas de hoje
          </Text>
          <PressableScale
            accessibilityLabel="Nova tarefa"
            onPress={() => openCapture('dump')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: colors.axel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={22} color={colors.axelOnFill} />
          </PressableScale>
        </View>

        {today.length === 0 ? (
          <EmptyState title="Dia livre" body="Nada com prazo hoje." icon="sunny-outline" />
        ) : (
          today.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/task/${t.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.hairline,
                minHeight: 58,
              }}
            >
              <PressableScale
                accessibilityLabel="Concluir"
                onPress={() => void toggleTaskDone(t.id, isGuest)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: colors.axel,
                }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {t.titulo}
                </Text>
                <Text variant="caption" muted>
                  {t.horaMinutos != null
                    ? minutesToLabel(t.horaMinutos)
                    : t.dataVencimento ?? 'Sem hora'}
                </Text>
              </View>
              <Ionicons name="analytics-outline" size={18} color={colors.inkFaint} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  )
}

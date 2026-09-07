import { useEffect, useMemo, useState } from 'react'
import { View, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  buildLifeScopeSnapshots,
  buildLooseScopeSnapshot,
  buildUserScopeSnapshots,
  stripTaskDisplayNotes,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState, PressableScale, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { FolderGlyph } from './FolderGlyph'

type Props = { tasks: MobileTask[] }

/** Pastas em grade (ícone + contagem) e leitura das anotações de cada tarefa. */
export function KanbanFoldersPane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)
  const [naming, setNaming] = useState(false)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const userScopes = useMemo(() => buildUserScopeSnapshots(tasks, lists), [tasks, lists])
  const lifeScopes = useMemo(
    () => buildLifeScopeSnapshots(tasks).filter((s) => s.total > 0),
    [tasks],
  )
  const loose = useMemo(() => buildLooseScopeSnapshot(tasks), [tasks])
  const q = query.trim().toLowerCase()
  const folders = userScopes.filter((s) => !q || s.name.toLowerCase().includes(q))
  const tile = Math.max(88, Math.floor((Math.min(width, 480) - 56) / 3))

  const notes = useMemo(
    () =>
      tasks
        .map((t) => ({ task: t, text: stripTaskDisplayNotes(t.anotacao) }))
        .filter((n) => n.text.length > 0),
    [tasks],
  )

  function go(id: string)
  {
    router.push(`/pasta/${id}` as never)
  }

  function create()
  {
    const created = addList(draft)
    setDraft('')
    setNaming(false)
    if (created) go(created.id)
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
          Pastas
        </Text>
        <Text variant="caption" muted>
          Organize por escopo e leia as anotações de cada tarefa
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          borderRadius: 999,
          paddingHorizontal: 14,
          backgroundColor: colors.surface,
        }}
      >
        <Ionicons name="search" size={16} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar pasta"
          placeholderTextColor={colors.inkFaint}
          style={{ flex: 1, color: colors.ink, fontSize: 15, minHeight: 44 }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="section" style={{ fontSize: 18 }}>
          Minhas pastas
        </Text>
        <Text variant="caption" muted>
          {folders.length} pasta{folders.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <PressableScale
          accessibilityLabel="Criar pasta"
          onPress={() => setNaming(true)}
          style={{ width: tile, alignItems: 'center', gap: 8, paddingVertical: 4 }}
        >
          <FolderGlyph color={colors.axel} plus size={tile - 8} />
          <Text variant="bodyStrong" style={{ fontSize: 13 }}>
            Nova pasta
          </Text>
          <Text variant="micro" muted>
            criar
          </Text>
        </PressableScale>
        {folders.map((scope) => (
          <PressableScale
            key={scope.id}
            onPress={() => go(scope.id)}
            style={{ width: tile, alignItems: 'center', gap: 8, paddingVertical: 4 }}
          >
            <FolderGlyph color={scope.color} size={tile - 8} />
            <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 13 }}>
              {scope.name}
            </Text>
            <Text variant="micro" muted>
              {scope.total} tarefa{scope.total === 1 ? '' : 's'}
            </Text>
          </PressableScale>
        ))}
      </View>

      {naming ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Nome da pasta"
            placeholderTextColor={colors.inkFaint}
            autoFocus
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 16,
              paddingHorizontal: 14,
              color: colors.ink,
              backgroundColor: colors.surface,
              fontSize: 15,
            }}
            onSubmitEditing={create}
          />
          <PrimaryButton label="Criar" size="sm" onPress={create} />
        </View>
      ) : null}

      {lifeScopes.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text variant="section" style={{ fontSize: 18 }}>
            Pilares
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {lifeScopes.map((scope) => (
              <PressableScale
                key={scope.id}
                onPress={() => go(scope.id)}
                style={{ width: tile, alignItems: 'center', gap: 8 }}
              >
                <FolderGlyph color={scope.color} size={tile - 8} />
                <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 13 }}>
                  {scope.name}
                </Text>
                <Text variant="micro" muted>
                  {scope.open} aberta{scope.open === 1 ? '' : 's'}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ) : null}

      {loose.total > 0 ? (
        <PressableScale
          onPress={() => go('loose')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: 18,
            backgroundColor: colors.elevated,
          }}
        >
          <FolderGlyph color={colors.inkMuted} size={48} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Sem pasta</Text>
            <Text variant="caption" muted>
              {loose.total} tarefa{loose.total === 1 ? '' : 's'} soltas
            </Text>
          </View>
        </PressableScale>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text variant="section" style={{ fontSize: 18 }}>
          Anotações
        </Text>
        {notes.length === 0 ? (
          <EmptyState
            title="Nenhuma anotação ainda"
            body="Na ficha da tarefa, a aba Notas guarda contexto — sem lista de to-dos."
            icon="document-text-outline"
          />
        ) : (
          notes.map(({ task, text }) => (
            <PressableScale
              key={task.id}
              onPress={() => router.push(`/task/${task.id}` as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 18,
                backgroundColor: colors.elevated,
                minHeight: 64,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${colors.axel}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.axel} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {task.titulo}
                </Text>
                <Text variant="caption" muted numberOfLines={2}>
                  {text}
                </Text>
              </View>
            </PressableScale>
          ))
        )}
      </View>
    </View>
  )
}

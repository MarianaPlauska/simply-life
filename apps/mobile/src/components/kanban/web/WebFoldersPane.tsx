import { useEffect, useMemo, useState } from 'react'
import { View, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {
  buildLifeScopeSnapshots,
  buildLooseScopeSnapshot,
  buildUserScopeSnapshots,
  stripTaskDisplayNotes,
  type MobileTask,
  type ScopeSnapshot,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { useKanbanListsStore } from '../../../store/kanbanListsStore'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { FolderGlyph } from '../FolderGlyph'
import { ListSurface, SectionHead } from './WebListParts'
import { LEX, useRowHover } from './kanbanWeb'

/** Linha de pasta: ícone pequeno, nome, contagem, barra curta de progresso. */
function FolderRow({ scope, onPress, label }: { scope: ScopeSnapshot; onPress: () => void; label?: string })
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={scope.name}
      style={(h) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: 52,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        backgroundColor: h ? hoverBg : 'transparent',
        cursor: 'pointer',
      })}
    >
      <FolderGlyph color={scope.color} size={26} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.ink }]}>
          {label ?? scope.name}
        </Text>
        <Text style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>
          {scope.open} aberta{scope.open === 1 ? '' : 's'} de {scope.total}
        </Text>
      </View>
      <View style={{ width: 120, height: 6, borderRadius: 3, backgroundColor: colors.hairline, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(0, Math.min(100, scope.pct))}%`, height: 6, backgroundColor: scope.color }} />
      </View>
      <Text style={[LEX.regular, { width: 44, textAlign: 'right', fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>
        {scope.pct}%
      </Text>
      <Icon name="chevron-forward" size={16} color={colors.inkFaint} />
    </WebHoverable>
  )
}

/** Pastas no computador: tabela de pastas e pilares à esquerda, anotações das tarefas à direita. */
export function WebFoldersPane({ tasks }: { tasks: MobileTask[] })
{
  const { colors, chart } = useTheme()
  const { width } = useWorkspace()
  const twoCol = width >= 1280
  const hoverBg = useRowHover()
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

  const userScopes = useMemo(() => buildUserScopeSnapshots(tasks, lists, chart), [tasks, lists, chart])
  const lifeScopes = useMemo(() => buildLifeScopeSnapshots(tasks, chart).filter((s) => s.total > 0), [tasks, chart])
  const loose = useMemo(() => buildLooseScopeSnapshot(tasks, colors.inkFaint), [tasks, colors.inkFaint])
  const q = query.trim().toLowerCase()
  const match = (s: ScopeSnapshot) => !q || s.name.toLowerCase().includes(q)
  const folders = userScopes.filter(match)
  const pillars = lifeScopes.filter(match)

  const notes = useMemo(
    () => tasks.map((t) => ({ task: t, text: stripTaskDisplayNotes(t.anotacao) })).filter((n) => n.text.length > 0),
    [tasks],
  )

  const go = (id: string) => router.push(`/pasta/${id}` as never)
  const create = () =>
  {
    const created = addList(draft)
    setDraft('')
    setNaming(false)
    if (created) go(created.id)
  }

  const inputStyle = {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    color: colors.ink,
    backgroundColor: colors.elevated,
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
  } as const

  const foldersBlock = (
    <View style={{ gap: 12, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, maxWidth: 360, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ position: 'absolute', left: 12, zIndex: 1 }}>
            <Icon name="search" size={16} color={colors.inkMuted} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar pasta"
            placeholderTextColor={colors.inkFaint}
            style={[inputStyle, { flex: 1, paddingLeft: 36 }]}
          />
        </View>
      </View>

      <ListSurface>
        <SectionHead first title="Minhas pastas" count={folders.length} onAdd={() => setNaming(true)} addLabel="Nova pasta" />
        {naming ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Nome da pasta"
              placeholderTextColor={colors.inkFaint}
              autoFocus
              onSubmitEditing={create}
              style={[inputStyle, { flex: 1 }]}
            />
            <WebHoverable
              onPress={create}
              accessibilityLabel="Criar pasta"
              style={(h) => webStyle({
                height: 38,
                justifyContent: 'center',
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: colors.axelFill,
                opacity: h ? 0.9 : 1,
                cursor: 'pointer',
              })}
            >
              <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.axelOnFill }]}>Criar</Text>
            </WebHoverable>
            <WebHoverable
              onPress={() =>
              {
                setNaming(false)
                setDraft('')
              }}
              accessibilityLabel="Cancelar"
              style={(h) => webStyle({ height: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, backgroundColor: h ? hoverBg : 'transparent', cursor: 'pointer' })}
            >
              <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>Cancelar</Text>
            </WebHoverable>
          </View>
        ) : null}
        {folders.length === 0 && !naming ? (
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted, paddingHorizontal: 20, paddingBottom: 16 }]}>
            {q ? 'Nenhuma pasta com esse nome.' : 'Crie uma pasta para juntar tarefas de um mesmo assunto.'}
          </Text>
        ) : null}
        {folders.map((s) => <FolderRow key={s.id} scope={s} onPress={() => go(s.id)} />)}

        {pillars.length > 0 ? (
          <>
            <SectionHead title="Pilares" count={pillars.length} />
            {pillars.map((s) => <FolderRow key={s.id} scope={s} onPress={() => go(s.id)} />)}
          </>
        ) : null}

        {loose.total > 0 && !q ? (
          <>
            <SectionHead title="Fora de pasta" />
            <FolderRow scope={loose} label="Tarefas soltas" onPress={() => go('loose')} />
          </>
        ) : null}
      </ListSurface>
    </View>
  )

  const notesBlock = (
    <ListSurface>
      <SectionHead first title="Anotações" count={notes.length} />
      {notes.length === 0 ? (
        <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted, paddingHorizontal: 20, paddingBottom: 16 }]}>
          Na ficha da tarefa, a aba Notas guarda contexto. O que você anotar aparece aqui.
        </Text>
      ) : (
        notes.map(({ task, text }) => (
          <WebHoverable
            key={task.id}
            onPress={() => router.push(`/task/${task.id}` as never)}
            accessibilityLabel={task.titulo}
            style={(h) => webStyle({
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              backgroundColor: h ? hoverBg : 'transparent',
              cursor: 'pointer',
            })}
          >
            <View style={{ paddingTop: 2 }}>
              <Icon name="document-text-outline" size={17} color={colors.inkMuted} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text numberOfLines={1} style={[LEX.medium, { fontSize: 15, lineHeight: 22, color: colors.ink }]}>{task.titulo}</Text>
              <Text numberOfLines={3} style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>{text}</Text>
            </View>
          </WebHoverable>
        ))
      )}
    </ListSurface>
  )

  if (!twoCol)
  {
    return (
      <View style={{ gap: 16 }}>
        {foldersBlock}
        {notesBlock}
      </View>
    )
  }

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 16, alignItems: 'start' })}>
      {foldersBlock}
      {/* anotações alinhadas com a tabela, abaixo da busca */}
      <View style={{ marginTop: 50 }}>{notesBlock}</View>
    </View>
  )
}

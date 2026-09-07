import { useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  applyTaskMeta,
  minutesToLabel,
  mergeEvoTags,
  stripTaskDisplayNotes,
  taskListId,
  taskDependsOnId,
  type MobileTask,
  type TaskStatus,
} from '@simply-life/shared'
import { Text, Field, Chip, PrimaryButton, CheckRow, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'

type Props = {
  task: MobileTask
  isGuest: boolean
}

const STATUS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
  { id: 'done', label: 'Feito' },
]

function parseHora(raw: string): number | null
{
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Propriedades + descrição + checklist (estilo Notion / Bitrix). */
export function TaskDetailEditor({ task, isGuest }: Props)
{
  const { colors, space } = useTheme()
  const patchTask = useDataStore((s) => s.patchTask)
  const setTaskStatus = useDataStore((s) => s.setTaskStatus)
  const toggleTaskCheck = useDataStore((s) => s.toggleTaskCheck)
  const addChecklistItem = useDataStore((s) => s.addChecklistItem)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrateLists = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)

  const [titulo, setTitulo] = useState(task.titulo)
  const [body, setBody] = useState(stripTaskDisplayNotes(task.anotacao))
  const [due, setDue] = useState(task.dataVencimento ?? '')
  const [hora, setHora] = useState(
    task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : '',
  )
  const [estimativa, setEstimativa] = useState(String(task.estimativaMinutos || 30))
  const [item, setItem] = useState('')
  const [novaLista, setNovaLista] = useState('')
  const [criarPastaOpen, setCriarPastaOpen] = useState(false)

  useEffect(() =>
  {
    hydrateLists()
  }, [hydrateLists])

  useEffect(() =>
  {
    setTitulo(task.titulo)
    setBody(stripTaskDisplayNotes(task.anotacao))
    setDue(task.dataVencimento ?? '')
    setHora(task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : '')
    setEstimativa(String(task.estimativaMinutos || 30))
  }, [task.id, task.titulo, task.anotacao, task.dataVencimento, task.horaMinutos, task.estimativaMinutos])

  const listId = taskListId(task)
  const depId = taskDependsOnId(task)

  function commitNotes(nextBody: string, nextList: string | null, nextDep: string | null = depId)
  {
    void patchTask(
      task.id,
      { anotacao: applyTaskMeta(mergeEvoTags(nextBody, task.anotacao), nextList, nextDep) },
      isGuest,
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <Field
        label="Título"
        value={titulo}
        onChangeText={setTitulo}
        onBlur={() =>
        {
          const t = titulo.trim()
          if (t && t !== task.titulo) void patchTask(task.id, { titulo: t }, isGuest)
        }}
      />

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Status
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {STATUS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                active={task.status === s.id}
                onPress={() => void setTaskStatus(task.id, s.id, isGuest)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Prioridade
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([1, 2, 3] as const).map((p) => (
            <Chip
              key={p}
              label={p === 1 ? 'Alta' : p === 2 ? 'Média' : 'Baixa'}
              active={task.prioridade === p}
              onPress={() => void patchTask(task.id, { prioridade: p }, isGuest)}
            />
          ))}
        </View>
      </View>

      <Field
        label="Prazo (AAAA-MM-DD)"
        value={due}
        onChangeText={setDue}
        placeholder="2026-09-10"
        onBlur={() =>
        {
          const iso = due.trim() || null
          if (iso && !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return
          void patchTask(task.id, { dataVencimento: iso }, isGuest)
        }}
      />

      <Field
        label="Horário (HH:MM)"
        value={hora}
        onChangeText={setHora}
        placeholder="09:30"
        onBlur={() =>
        {
          const mins = hora.trim() ? parseHora(hora) : null
          void patchTask(task.id, { horaMinutos: mins }, isGuest)
        }}
      />

      <Field
        label="Estimativa (minutos)"
        value={estimativa}
        keyboardType="number-pad"
        onChangeText={setEstimativa}
        onBlur={() =>
        {
          const n = Number(estimativa)
          if (!Number.isFinite(n) || n <= 0) return
          void patchTask(task.id, { estimativaMinutos: Math.round(n) }, isGuest)
        }}
      />

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" muted>
            Pasta / lista
          </Text>
          <PressableScale
            accessibilityLabel="Criar nova pasta"
            onPress={() => setCriarPastaOpen((v) => !v)}
            style={{
              minHeight: 36,
              minWidth: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: criarPastaOpen ? colors.axelMuted : colors.elevated,
            }}
          >
            <Ionicons name={criarPastaOpen ? 'close' : 'add'} size={20} color={colors.axel} />
          </PressableScale>
        </View>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Chip
              label="Nenhuma"
              active={!listId}
              onPress={() => commitNotes(body, null)}
            />
            {lists.map((l) => (
              <Chip
                key={l.id}
                label={l.name}
                active={listId === l.id}
                onPress={() => commitNotes(body, l.id)}
              />
            ))}
          </View>
        </ScrollView>
        {criarPastaOpen ? (
          <Field
            label="Nova pasta"
            value={novaLista}
            placeholder="Nome e Enter"
            onChangeText={setNovaLista}
            onSubmitEditing={() =>
            {
              const created = addList(novaLista)
              setNovaLista('')
              setCriarPastaOpen(false)
              if (created) commitNotes(body, created.id)
            }}
          />
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Depende de
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label="Nenhuma"
              active={!depId}
              onPress={() => commitNotes(body, listId, null)}
            />
            {tasks
              .filter((t) => t.id !== task.id && t.status !== 'done')
              .map((t) => (
                <Chip
                  key={t.id}
                  label={t.titulo}
                  active={depId === t.id}
                  onPress={() => commitNotes(body, listId, t.id)}
                />
              ))}
          </View>
        </ScrollView>
      </View>

      <Field
        label="Descrição"
        value={body}
        onChangeText={setBody}
        onBlur={() => commitNotes(body, listId)}
        multiline
        placeholder="Contexto, links, critérios de pronto, pessoas..."
        style={{ minHeight: 160, textAlignVertical: 'top', paddingVertical: 14 }}
      />

      <View style={{ gap: 8 }}>
        <Text variant="section">Checklist</Text>
        {task.checklist.length === 0 ? (
          <Text variant="caption" muted>
            Nenhum item. Adicione passos abaixo.
          </Text>
        ) : (
          task.checklist.map((c) => (
            <CheckRow
              key={c.id}
              title={c.texto}
              subtitle={c.feito ? 'Feito' : 'Pendente'}
              done={c.feito}
              showSeparator
              onToggle={() => void toggleTaskCheck(task.id, c.id, !c.feito, isGuest)}
            />
          ))
        )}
        <Field
          label="Novo item"
          value={item}
          onChangeText={setItem}
          placeholder="Quebrar em um passo"
          onSubmitEditing={() =>
          {
            void addChecklistItem(task.id, item, isGuest)
            setItem('')
          }}
        />
        <PrimaryButton
          label="Adicionar item"
          variant="secondary"
          onPress={() =>
          {
            void addChecklistItem(task.id, item, isGuest)
            setItem('')
          }}
        />
      </View>
    </View>
  )
}

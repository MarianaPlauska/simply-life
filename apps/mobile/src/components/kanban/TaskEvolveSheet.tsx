import { useCallback, useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  EVO_STEPS,
  hasReviewLater,
  minutesToLabel,
  nearestEvoStep,
  parseEvoNotes,
  stampEvoNote,
  stampEvoPct,
  stampReviewLater,
  taskProgressPct,
  suggestTaskSteps,
  stepsToChecklistItems,
  type EvoStep,
} from '@simply-life/shared'
import { Chip, Field, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'

/** Sheet arredondado: edição leve + evolução em marcos com nota para o eu do futuro. */
export function TaskEvolveSheet()
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const taskId = useTaskEvolveStore((s) => s.taskId)
  const close = useTaskEvolveStore((s) => s.close)
  const task = useDataStore((s) => s.tasks.find((t) => t.id === taskId) ?? null)
  const patchTask = useDataStore((s) => s.patchTask)
  const removeTask = useDataStore((s) => s.removeTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [step, setStep] = useState<EvoStep>(0)

  useEffect(() =>
  {
    if (!task)
    {
      return
    }
    const next = nearestEvoStep(taskProgressPct(task))
    setTitle(task.titulo)
    setStep(next)
    setNote(parseEvoNotes(task.anotacao)[next] ?? '')
  }, [taskId])

  const persist = useCallback(
    async (pct: EvoStep, noteText: string, nextTitle: string) =>
    {
      const current = useDataStore.getState().tasks.find((row) => row.id === taskId)
      if (!current) return
      const notes = stampEvoPct(stampEvoNote(current.anotacao, pct, noteText), pct)
      const status = pct >= 100 ? 'done' : pct <= 0 ? 'todo' : 'doing'
      await patchTask(
        current.id,
        {
          titulo: nextTitle.trim() || current.titulo,
          anotacao: notes,
          progresso: pct / 100,
          status,
        },
        isGuest,
      )
    },
    [taskId, patchTask, isGuest],
  )

  const onPickStep = async (next: EvoStep) =>
  {
    if (!taskId) return
    await persist(step, note, title)
    const latest = useDataStore.getState().tasks.find((row) => row.id === taskId)
    const nextNote = parseEvoNotes(latest?.anotacao || '')[next] ?? ''
    setStep(next)
    setNote(nextNote)
    await persist(next, nextNote, title)
  }

  const onClose = async () =>
  {
    if (task) await persist(step, note, title)
    close()
  }

  if (!taskId || !task) return null

  const when =
    task.horaMinutos != null
      ? minutesToLabel(task.horaMinutos)
      : task.dataVencimento
        ? new Date(`${task.dataVencimento}T12:00:00`).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
          })
        : 'Sem hora'

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => void onClose()}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => void onClose()} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              padding: space.lg,
              paddingBottom: Math.max(insets.bottom, space.lg) + 8,
              gap: space.md,
              maxHeight: '88%',
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.hairlineStrong,
              }}
            />
            <Field label="Atividade" value={title} onChangeText={setTitle} />
            <Text variant="caption" muted>
              {when} · toque no percentual e deixe um recado no marco
            </Text>
            <Text variant="hero" style={{ fontSize: 42, letterSpacing: -1.2 }}>
              {step}%
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EVO_STEPS.map((pct) => (
                <Chip
                  key={pct}
                  label={`${pct}%`}
                  active={step === pct}
                  onPress={() => void onPickStep(pct)}
                />
              ))}
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
              <Field
                label={`Nota em ${step}% (eu do futuro)`}
                value={note}
                onChangeText={setNote}
                placeholder="O que este marco significa — um lembrete para você depois."
                multiline
                style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 14 }}
              />
            </ScrollView>
            <PrimaryButton
              label={hasReviewLater(task.anotacao) ? 'Tirar ver depois' : 'Ver depois'}
              variant={hasReviewLater(task.anotacao) ? 'secondary' : 'ghost'}
              icon="flag-outline"
              onPress={() =>
              {
                const on = !hasReviewLater(task.anotacao)
                void patchTask(task.id, { anotacao: stampReviewLater(task.anotacao, on) }, isGuest)
              }}
            />
            <PrimaryButton
              label="Dividir em passos"
              variant="secondary"
              icon="git-branch-outline"
              disabled={task.checklist.length > 0}
              onPress={() =>
              {
                const steps = suggestTaskSteps(title, task.anotacao || '')
                if (steps.length === 0) return
                void patchTask(
                  task.id,
                  { checklist: stepsToChecklistItems(steps) },
                  isGuest,
                )
              }}
            />
            <PrimaryButton
              label="Ficha completa"
              variant="ghost"
              onPress={() =>
              {
                void persist(step, note, title)
                close()
                router.push(`/task/${task.id}`)
              }}
            />
            <PrimaryButton label="Pronto" onPress={() => void onClose()} />
            {task.status !== 'done' ? (
              <PrimaryButton
                label="Excluir tarefa"
                variant="danger"
                onPress={() =>
                {
                  const go = () =>
                  {
                    void removeTask(task.id, isGuest)
                    close()
                  }
                  if (Platform.OS === 'web')
                  {
                    if (
                      typeof window !== 'undefined' &&
                      window.confirm('Sai da lista. O que já foi concluído continua no histórico Feitas.')
                    )
                    {
                      go()
                    }
                    return
                  }
                  Alert.alert(
                    'Excluir tarefa',
                    'Sai da lista. O que já foi concluído continua no histórico Feitas.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: go },
                    ],
                  )
                }}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

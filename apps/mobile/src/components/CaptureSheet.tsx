import {
  Modal,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, PrimaryButton, PillTabs, Field } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useCaptureStore, type CaptureKind } from '../store/captureStore'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { hapticLight } from '../lib/haptics'
import { MoodFaceRow } from './MoodFace'

const TABS: { id: CaptureKind; label: string }[] = [
  { id: 'dump', label: 'Dump' },
  { id: 'task', label: 'Tarefa' },
  { id: 'expense', label: 'Gasto' },
  { id: 'note', label: 'Nota' },
]

const PLACEHOLDERS: Record<CaptureKind, string> = {
  dump: 'Uma linha por item - tarefas ou “café 12,50”',
  task: 'O que precisa ser feito?',
  expense: 'Ex: café 12,50',
  note: 'Como foi o dia?',
}

export function CaptureSheet()
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const open = useCaptureStore((s) => s.open)
  const kind = useCaptureStore((s) => s.kind)
  const setKind = useCaptureStore((s) => s.setKind)
  const closeCapture = useCaptureStore((s) => s.closeCapture)
  const isGuest = useAuthStore((s) => s.isGuest)
  const addTask = useDataStore((s) => s.addTask)
  const addHumor = useDataStore((s) => s.addHumor)
  const addExpenseFromText = useDataStore((s) => s.addExpenseFromText)
  const commitDump = useDataStore((s) => s.commitDump)
  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetAndClose = () =>
  {
    setText('')
    setMood(null)
    setSaved(false)
    setError(null)
    closeCapture()
  }

  const onSave = async () =>
  {
    if (!text.trim()) return
    if (kind === 'note' && mood == null)
    {
      setError('Escolha como você está se sentindo')
      return
    }
    setSaving(true)
    setError(null)
    try
    {
      if (kind === 'task')
      {
        await addTask(text.trim(), isGuest)
      }
      else if (kind === 'expense')
      {
        const res = await addExpenseFromText(text, isGuest)
        if (!res.ok)
        {
          setError(res.error || 'Não foi possível salvar o gasto')
          setSaving(false)
          return
        }
      }
      else if (kind === 'note')
      {
        await addHumor(mood ?? 3, text.trim(), isGuest)
      }
      else
      {
        const res = await commitDump(text, isGuest)
        if (!res.ok)
        {
          setError(res.error || 'Não foi possível salvar o dump')
          setSaving(false)
          return
        }
      }
      hapticLight()
      setSaved(true)
      setTimeout(resetAndClose, 600)
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
          onPress={resetAndClose}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              padding: space.lg,
              paddingBottom: Math.max(insets.bottom, space.lg),
              gap: space.md,
              minHeight: 320,
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
            <Text variant="section">Captura rápida</Text>
            <PillTabs
              tabs={TABS}
              value={kind}
              onChange={(next) =>
              {
                setKind(next)
                setError(null)
                setSaved(false)
              }}
            />
            {kind === 'note' ? <MoodFaceRow value={mood} onChange={setMood} /> : null}
            <Field
              label={kind === 'expense' ? 'Descrição e valor' : 'Conteúdo'}
              placeholder={PLACEHOLDERS[kind]}
              multiline
              value={text}
              onChangeText={setText}
              style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: 14 }}
            />
            {error ? (
              <Text variant="caption" color={colors.danger}>
                {error}
              </Text>
            ) : null}
            {saved ? (
              <View
                style={{
                  minHeight: 48,
                  borderRadius: radius.control,
                  backgroundColor: colors.healthMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="bodyStrong" color={colors.health}>
                  Salvo
                </Text>
              </View>
            ) : (
              <PrimaryButton
                label="Salvar"
                loading={saving}
                onPress={() => void onSave()}
                disabled={!text.trim() || saving}
              />
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

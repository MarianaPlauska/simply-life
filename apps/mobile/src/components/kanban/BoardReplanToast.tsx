import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_CONTENT_HEIGHT } from '@simply-life/ui-tokens'
import { BOARD_MOVE_LABEL, describeDayPt, replanHeadline, type BoardMove } from '@simply-life/shared'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useBoardReplanStore } from '../../store/boardReplanStore'
import { useWorkspace } from '../../layout/useWorkspace'

const AUTO_HIDE_MS = 14000
const NOTICE_MS = 4000

/** Aviso global "Axel moveu N tarefas · Ver · Desfazer" + detalhe de cada movimento. */
export function BoardReplanToast()
{
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { showRail } = useWorkspace()
  const batch = useBoardReplanStore((s) => s.lastBatch)
  const visibleId = useBoardReplanStore((s) => s.visibleBatchId)
  const notice = useBoardReplanStore((s) => s.notice)
  const dismiss = useBoardReplanStore((s) => s.dismiss)
  const undoBatch = useBoardReplanStore((s) => s.undoBatch)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const visible = Boolean(batch && visibleId === batch.id)

  useEffect(() =>
  {
    if (sheetOpen) return
    if (!visible && !notice) return
    const t = setTimeout(dismiss, visible ? AUTO_HIDE_MS : NOTICE_MS)
    return () => clearTimeout(t)
  }, [visible, notice, sheetOpen, dismiss])

  const bottom = showRail ? 24 : TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8) + 72

  if (!visible && !notice)
  {
    if (sheetOpen && batch) return <MovesSheet onClose={() => setSheetOpen(false)} />
    return <ProposalBanner bottom={bottom} />
  }

  const active = batch ? batch.moves.filter((m) => !batch.undone.includes(m.taskId)) : []

  return (
    <>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 16, right: 16, bottom, alignItems: 'center' }}
      >
        <View
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 520,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.axel,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Ionicons name="sparkles" size={16} color={colors.axel} />
          <Text variant="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
            {visible ? replanHeadline(active) : notice}
          </Text>
          {visible ? (
            <>
              <Pressable
                onPress={() => setSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Ver o que o Axel mudou"
                hitSlop={8}
                style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 }}
              >
                <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                  Ver
                </Text>
              </Pressable>
              <Pressable
                onPress={async () =>
                {
                  setBusy(true)
                  try
                  {
                    await undoBatch()
                  }
                  finally
                  {
                    setBusy(false)
                  }
                }}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Desfazer todas as mudanças"
                hitSlop={8}
                style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 4, opacity: busy ? 0.5 : 1 }}
              >
                <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                  Desfazer
                </Text>
              </Pressable>
            </>
          ) : null}
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Fechar aviso" hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.inkMuted} />
          </Pressable>
        </View>
      </View>
      {sheetOpen ? <MovesSheet onClose={() => setSheetOpen(false)} /> : null}
    </>
  )
}

function MoveRow({ move, undone, onUndo }: { move: BoardMove; undone: boolean; onUndo: () => void })
{
  const { colors } = useTheme()
  return (
    <View
      style={{
        gap: 4,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
        opacity: undone ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
          {move.titulo}
        </Text>
        {undone ? (
          <Text variant="caption" muted>
            Desfeita
          </Text>
        ) : (
          <Pressable onPress={onUndo} accessibilityRole="button" accessibilityLabel={`Desfazer ${move.titulo}`} hitSlop={8}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Desfazer
            </Text>
          </Pressable>
        )}
      </View>
      <Text variant="caption" color={colors.axel}>
        {BOARD_MOVE_LABEL[move.kind]} · {describeDayPt(move.from)} → {describeDayPt(move.to)}
      </Text>
      <Text variant="caption" muted>
        {move.reason}
      </Text>
    </View>
  )
}

function MovesSheet({ onClose }: { onClose: () => void })
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const batch = useBoardReplanStore((s) => s.lastBatch)
  const undoMove = useBoardReplanStore((s) => s.undoMove)
  const undoBatch = useBoardReplanStore((s) => s.undoBatch)
  if (!batch) return null
  const pending = batch.moves.filter((m) => !batch.undone.includes(m.taskId)).length

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: '80%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
            gap: space.sm,
          }}
        >
          <Text variant="section">O que o Axel mudou</Text>
          <Text variant="caption" muted>
            Nada foi apagado, só a data. O que você desfizer fica travado por 7 dias: o Axel não mexe de novo.
            {batch.stillOverloaded > 0
              ? ` ${batch.stillOverloaded === 1 ? 'Um dia continua' : `${batch.stillOverloaded} dias continuam`} acima do seu tempo livre sem quebrar prazos firmes.`
              : ''}
          </Text>
          <ScrollView style={{ flexGrow: 0 }}>
            {batch.moves.map((m) => (
              <MoveRow
                key={m.taskId}
                move={m}
                undone={batch.undone.includes(m.taskId)}
                onUndo={() => void undoMove(m.taskId)}
              />
            ))}
          </ScrollView>
          {pending > 0 ? (
            <PrimaryButton label="Desfazer tudo" variant="secondary" onPress={() => void undoBatch().then(onClose)} />
          ) : null}
          <PrimaryButton label="Fechar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/** Modo previsível: o Axel sugere, a pessoa decide. Fica até ser respondido. */
function ProposalBanner({ bottom }: { bottom: number })
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const proposal = useBoardReplanStore((s) => s.proposal)
  const applyProposal = useBoardReplanStore((s) => s.applyProposal)
  const dismissProposal = useBoardReplanStore((s) => s.dismissProposal)
  const [open, setOpen] = useState(false)
  if (!proposal || proposal.moves.length === 0) return null
  const n = proposal.moves.length

  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom, alignItems: 'center' }}>
        <View
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 520,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.hairlineStrong,
          }}
        >
          <Ionicons name="help-circle-outline" size={18} color={colors.axel} />
          <Text variant="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
            {n === 1 ? 'O Axel sugere mudar 1 tarefa' : `O Axel sugere mudar ${n} tarefas`}
          </Text>
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Ver sugestões do Axel" hitSlop={8}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>Ver</Text>
          </Pressable>
          <Pressable onPress={dismissProposal} accessibilityRole="button" accessibilityLabel="Deixar como está" hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.inkMuted} />
          </Pressable>
        </View>
      </View>
      {open ? (
        <Modal visible transparent animationType="none" onRequestClose={() => setOpen(false)}>
          <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                maxHeight: '80%',
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: space.lg,
                paddingBottom: Math.max(insets.bottom, space.lg),
                gap: space.sm,
              }}
            >
              <Text variant="section">Sugestões do Axel</Text>
              <Text variant="caption" muted>
                Nada foi mudado. Você decide: aplicar tudo ou deixar o dia como está.
              </Text>
              <ScrollView style={{ flexGrow: 0 }}>
                {proposal.moves.map((m) => (
                  <View key={m.taskId} style={{ gap: 4, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }}>{m.titulo}</Text>
                    <Text variant="caption">{describeDayPt(m.from)} → {describeDayPt(m.to)}</Text>
                    <Text variant="caption" muted>{m.reason}</Text>
                  </View>
                ))}
              </ScrollView>
              <PrimaryButton label="Aplicar sugestões" onPress={() => { setOpen(false); void applyProposal() }} />
              <PrimaryButton label="Deixar como está" variant="ghost" onPress={() => { setOpen(false); dismissProposal() }} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  )
}

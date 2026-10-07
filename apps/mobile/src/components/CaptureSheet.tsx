import {
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { Modal } from '../ui/Modal'
import { useWorkspace } from '../layout/useWorkspace'
import { Icon } from '../ui/Icon'
import { useEffect, useState, Fragment, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, PrimaryButton, PillTabs, Field, CloseButton } from '../ui'
import { useTheme, ThemeProvider } from '../theme/ThemeProvider'
import { useCaptureStore, type CaptureKind } from '../store/captureStore'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useTaskWaitStore } from '../store/taskWaitStore'
import { hapticLight } from '../lib/haptics'
import { MoodFaceRow } from './MoodFace'
import {
  fetchPartnerWorkspace,
  type PartnerWorkspaceState,
} from '../lib/partnerWorkspace'
import {
  applyTaskMeta,
  stampPlannedHelpers,
  planTaskDrafts,
  monthPaidKey,
  todayIso,
  isoMonthsFrom,
  moodLabel,
  DUMP_LOW_CONFIDENCE,
  formatBRL,
  installmentPlan,
  purchaseCheckMessage,
  spendRoomHint,
  type DumpItem,
  type FinanceCategory,
  type FinanceEscopo,
} from '@simply-life/shared'
import { parseExpenseQuick } from '../lib/sync/finance'
import { FinanceCategoriesSheet } from './finance/FinanceCategoriesSheet'
import { FinanceFixasSheet } from './finance/FinanceFixasSheet'
import {
  CaptureTaskForm,
  SelectChip,
  emptyCaptureTaskDraft,
  parseCaptureHora,
  type CaptureTaskDraft,
} from './CaptureTaskForm'
import {
  TaskPromptComposer,
  buildTaskPromptSaveItems,
  emptyTaskPromptState,
  useOrchestratorContext,
  type TaskPromptState,
} from './TaskPromptComposer'
import { useOrchestratorPrefsStore } from '../store/orchestratorPrefsStore'
import { useDuePaidStore } from '../store/duePaidStore'
import { CaptureExpenseFields } from './CaptureExpenseFields'
import { CaptureNoteFields } from './CaptureNoteFields'
import { CaptureStudioChrome } from './CaptureStudioChrome'
import { useKanbanListsStore } from '../store/kanbanListsStore'
import { useNotesStore } from '../store/notesStore'
import { DumpReview, dumpItemsMissingValue, dumpSummary } from './DumpReview'
import { readDumpLocally, refineDumpWithAi } from '../lib/dumpCaptureApi'
import { evaluateSpend, guardSpend } from '../lib/spendGuard'
import { useMonthProjection } from './finance/FinanceForecastCards'
import { SpendGuardHost } from './finance/SpendGuardHost'

const TABS: { id: CaptureKind; label: string }[] = [
  { id: 'dump', label: 'Dump' },
  { id: 'task', label: 'Tarefa' },
  { id: 'expense', label: 'Gasto' },
  { id: 'note', label: 'Nota' },
]

const PLACEHOLDERS: Record<CaptureKind, string> = {
  dump: 'Uma coisa por linha. Ex.: dentista amanhã 9h, café 12,50, lembrar mãe de pagar conta',
  task: 'O que precisa ser feito?',
  expense: 'Ex: café 12,50',
  note: 'Escreva o que ficou do dia',
}

type Pagamento = 'conta' | 'cartao' | 'boleto'
type Recorrencia = 'nenhuma' | 'mensal' | 'semanal'

function studioCopy(
  kind: CaptureKind,
  lancamento: 'despesa' | 'receita',
): { title: string; subtitle: string }
{
  if (kind === 'task')
  {
    return {
      title: 'Nova tarefa',
      subtitle: 'Escreva solto: o Axel separa, estima, encaixa na semana e liga aos seus gastos.',
    }
  }
  if (kind === 'expense')
  {
    if (lancamento === 'receita')
    {
      return {
        title: 'Nova receita',
        subtitle: 'O que entrou na conta: salário, extra, transferência.',
      }
    }
    return {
      title: 'Novo gasto',
      subtitle: 'Valor, categoria e quando aconteceu. Crédito só sai do saldo na fatura.',
    }
  }
  if (kind === 'note')
  {
    return {
      title: 'Diário do dia',
      subtitle: 'Humor e uma entrada rápida. Texto opcional.',
    }
  }
  return { title: 'Captura', subtitle: 'Escreva solto, uma coisa por linha. Antes de salvar, você confere o que o app entendeu.' }
}

function expenseIso(raw: string): string
{
  return /^\d{4}-\d{2}-\d{2}$/.test(raw.trim()) ? raw.trim() : todayIso()
}

export function CaptureSheet()
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowH } = useWindowDimensions()
  const { showRail } = useWorkspace()
  // no computador a ficha não precisa da tela toda: altura de um formulário
  const sheetMaxH = Math.round(showRail ? Math.min(windowH * 0.88, 600) : windowH * 0.88)
  const open = useCaptureStore((s) => s.open)
  const kind = useCaptureStore((s) => s.kind)
  const listId = useCaptureStore((s) => s.listId)
  const studio = useCaptureStore((s) => s.studio)
  const seedPrioridade = useCaptureStore((s) => s.seedPrioridade)
  const seedLancamento = useCaptureStore((s) => s.seedLancamento)
  const setKind = useCaptureStore((s) => s.setKind)
  const closeCapture = useCaptureStore((s) => s.closeCapture)
  const isGuest = useAuthStore((s) => s.isGuest)
  const addTask = useDataStore((s) => s.addTask)
  const addHumor = useDataStore((s) => s.addHumor)
  const addExpenseFromText = useDataStore((s) => s.addExpenseFromText)
  const addCardSpend = useDataStore((s) => s.addCardSpend)
  const addContaFixa = useDataStore((s) => s.addContaFixa)
  const commitDumpItems = useDataStore((s) => s.commitDumpItems)
  const contasFixas = useDataStore((s) => s.contasFixas)
  const financeCards = useDataStore((s) => s.financeCards)
  const folders = useKanbanListsStore((s) => s.lists)
  const hydrateFolders = useKanbanListsStore((s) => s.hydrate)
  const addFolder = useKanbanListsStore((s) => s.addList)
  const createNote = useNotesStore((s) => s.create)
  const updateNote = useNotesStore((s) => s.update)

  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerWs, setPartnerWs] = useState<PartnerWorkspaceState | null>(null)
  const [escopo, setEscopo] = useState<FinanceEscopo>('pessoal')
  const [pagoContaCasal, setPagoContaCasal] = useState(false)
  const [lancamento, setLancamento] = useState<'despesa' | 'receita'>('despesa')
  const [categoria, setCategoria] = useState<FinanceCategory>('outros')
  const [pagamento, setPagamento] = useState<Pagamento>('conta')
  const [cardId, setCardId] = useState<string | null>(null)
  const [folderId, setFolderId] = useState<string | null>(null)
  const [salvarFixa, setSalvarFixa] = useState(false)
  const [recorrencia, setRecorrencia] = useState<Recorrencia>('nenhuma')
  const [catsOpen, setCatsOpen] = useState(false)
  const [fixasOpen, setFixasOpen] = useState(false)
  const [expenseDate, setExpenseDate] = useState(() => todayIso())
  const [parcelas, setParcelas] = useState(1)
  const [porParcela, setPorParcela] = useState(false)
  const [parcelasPagas, setParcelasPagas] = useState(0)
  const [taskDraft, setTaskDraft] = useState<CaptureTaskDraft>(() => emptyCaptureTaskDraft(null))
  const [promptState, setPromptState] = useState<TaskPromptState>(() => emptyTaskPromptState())
  const organizeRef = useRef<(() => void) | null>(null)
  /** null = escrevendo; lista = revisando o que o app entendeu */
  const [dumpItems, setDumpItems] = useState<DumpItem[] | null>(null)
  const [dumpReading, setDumpReading] = useState(false)
  const [savedLabel, setSavedLabel] = useState<string | null>(null)
  const captureMode = useOrchestratorPrefsStore((s) => s.captureMode)
  const hydrateOrchestratorPrefs = useOrchestratorPrefsStore((s) => s.hydrate)
  const patchOrchestratorPrefs = useOrchestratorPrefsStore((s) => s.patch)
  const orchestratorCtx = useOrchestratorContext()
  const promptMode = kind === 'task' && captureMode === 'prompt'
  const promptIncluded = promptState.drafts.filter(
    (d) => !promptState.excluded[d.key] && d.titulo.trim(),
  ).length

  useEffect(() =>
  {
    if (open)
    {
      hydrateFolders()
      void hydrateOrchestratorPrefs()
    }
  }, [open, hydrateFolders, hydrateOrchestratorPrefs])

  useEffect(() =>
  {
    if (!open || kind !== 'expense' || isGuest) return
    void fetchPartnerWorkspace().then(setPartnerWs)
  }, [open, kind, isGuest])

  useEffect(() =>
  {
    if (pagamento === 'cartao' && !cardId && financeCards[0])
    {
      setCardId(financeCards[0].id)
    }
  }, [pagamento, cardId, financeCards])

  useEffect(() =>
  {
    if (open)
    {
      const draft = emptyCaptureTaskDraft(listId)
      if (seedPrioridade) draft.prioridade = seedPrioridade
      setTaskDraft(draft)
      setExpenseDate(todayIso())
      setLancamento(seedLancamento === 'receita' ? 'receita' : 'despesa')
      setFolderId(kind === 'expense' && listId ? listId : null)
    }
  }, [open, listId, seedPrioridade, seedLancamento, kind])

  /** Parcelas que o gasto vai criar (à vista = uma). Mesma conta para a dica, o aviso e o salvamento. */
  const expensePlan = (valor: number, data: string) =>
    installmentPlan({
      valor,
      parcelas: pagamento === 'conta' ? 1 : parcelas,
      data,
      porParcela,
      pagas: parcelasPagas,
    }).map((p) => ({ ...p, data: isoMonthsFrom(data, p.offset) }))

  const projection = useMonthProjection()
  const spendHint = (() =>
  {
    if (!open || kind !== 'expense' || lancamento !== 'despesa') return null
    const parsed = parseExpenseQuick(text)
    if (!parsed)
    {
      return { text: spendRoomHint(projection, formatBRL), tone: projection.sobra < 0 ? 'apertado' as const : 'ok' as const }
    }
    const check = evaluateSpend({
      launches: expensePlan(parsed.valor, expenseIso(expenseDate)),
      cardId: pagamento === 'cartao' ? cardId : null,
    })
    if (check.tom === 'sem-dados') return null
    return {
      text: purchaseCheckMessage(check, formatBRL).mensagem,
      tone: check.tom === 'apertado' ? 'apertado' as const : check.tom === 'atencao' ? 'atencao' as const : 'ok' as const,
    }
  })()

  const resetAndClose = () =>
  {
    setText('')
    setMood(null)
    setSaved(false)
    setError(null)
    setEscopo('pessoal')
    setPagoContaCasal(false)
    setCategoria('outros')
    setPagamento('conta')
    setCardId(null)
    setFolderId(null)
    setSalvarFixa(false)
    setRecorrencia('nenhuma')
    setExpenseDate(todayIso())
    setParcelas(1)
    setPorParcela(false)
    setParcelasPagas(0)
    setLancamento('despesa')
    setTaskDraft(emptyCaptureTaskDraft(null))
    setPromptState(emptyTaskPromptState())
    setDumpItems(null)
    setDumpReading(false)
    setSavedLabel(null)
    closeCapture()
  }

  const canSave = (): boolean =>
  {
    if (saving) return false
    if (promptMode) return promptIncluded > 0
    if (kind === 'task') return Boolean(taskDraft.titulo.trim())
    if (kind === 'note') return mood != null
    if (kind === 'dump' && dumpItems)
    {
      return dumpItems.length > 0 && dumpItemsMissingValue(dumpItems) === 0
    }
    if (kind === 'dump' && dumpReading) return false
    return Boolean(text.trim())
  }

  /** Dump, passo 1: lê as linhas (local primeiro; IA só nas duvidosas, com conta e rede). */
  const onReviewDump = async () =>
  {
    const local = readDumpLocally(text, new Date())
    if (local.length === 0) return
    setError(null)
    const needsAi = !isGuest && local.some((i) => i.confianca < DUMP_LOW_CONFIDENCE)
    if (!needsAi)
    {
      setDumpItems(local)
      return
    }
    setDumpReading(true)
    try
    {
      const res = await refineDumpWithAi(local, { isGuest })
      setDumpItems(res.items)
    }
    catch
    {
      setDumpItems(local)
    }
    finally
    {
      setDumpReading(false)
    }
  }

  /** Dump, passo 2: salva cada item com a ação do seu tipo. */
  const onSaveDump = async () =>
  {
    if (!dumpItems || dumpItems.length === 0) return
    setSaving(true)
    setError(null)
    try
    {
      const gastos = dumpItems
        .filter((i) => i.kind === 'gasto' && (i.valor ?? 0) > 0)
        .map((i) => ({ valor: i.valor ?? 0, data: i.data ?? todayIso() }))
      if (gastos.length && !(await guardSpend({ launches: gastos, host: 'capture' }))) return
      const res = await commitDumpItems(dumpItems, isGuest)
      if (!res.ok)
      {
        // o que já entrou sai da lista, para não duplicar ao tentar de novo
        if (res.count > 0) setDumpItems(dumpItems.slice(res.count))
        setError(res.error || 'Não foi possível salvar tudo')
        return
      }
      hapticLight()
      const summary = dumpSummary(res.counts, true)
      setSavedLabel(summary ? `Salvo: ${summary}` : 'Salvo')
      setSaved(true)
      setTimeout(resetAndClose, 1200)
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

  const onPrimary = () =>
  {
    if (kind === 'dump')
    {
      if (dumpItems) void onSaveDump()
      else void onReviewDump()
      return
    }
    void onSave()
  }

  const onSave = async () =>
  {
    if (promptMode)
    {
      if (promptIncluded === 0) return
    }
    else if (kind === 'task')
    {
      if (!taskDraft.titulo.trim()) return
    }
    else if (kind === 'note')
    {
      if (mood == null) return
    }
    else if (!text.trim()) return
    if (kind === 'note' && mood == null)
    {
      setError('Escolha como você está se sentindo')
      return
    }
    setSaving(true)
    setError(null)
    try
    {
      if (promptMode)
      {
        // aberto de uma pasta: rascunhos sem pasta herdam a pasta de origem
        const drafts = promptState.drafts.map((d) => (d.listId || !listId ? d : { ...d, listId }))
        const plans = planTaskDrafts(drafts, orchestratorCtx, promptState.chosen)
        const items = buildTaskPromptSaveItems({ ...promptState, drafts }, plans)
        for (const item of items)
        {
          await addTask(item.titulo, isGuest, item.notas, item.extra)
        }
      }
      else if (kind === 'task')
      {
        // pessoas "no meio" ficam planejadas nas notas; quem entra "antes" abre a espera já na criação
        const notas = stampPlannedHelpers(
          applyTaskMeta(taskDraft.descricao, taskDraft.listId, taskDraft.dependsOnId),
          taskDraft.pessoas.filter((p) => p.quando === 'meio'),
        )
        const first = taskDraft.pessoas.find((p) => p.quando === 'antes')
        const n = Number(taskDraft.estimativa)
        await addTask(taskDraft.titulo.trim(), isGuest, notas, {
          dataVencimento: taskDraft.due.trim() || null,
          horaMinutos: parseCaptureHora(taskDraft.hora),
          estimativaMinutos: Number.isFinite(n) && n > 0 ? Math.round(n) : 30,
          prioridade: taskDraft.prioridade,
          status: taskDraft.status,
          checklist: taskDraft.checklist,
        })
        const created = useDataStore.getState().tasks[0]
        if (first && created && created.titulo === taskDraft.titulo.trim())
        {
          useTaskWaitStore.getState().start({
            taskId: created.id,
            pessoa: first.pessoa,
            amigoId: first.amigoId,
            motivo: first.motivo,
            canal: null,
          })
        }
      }
      else if (kind === 'expense')
      {
        const parsed = parseExpenseQuick(text)
        if (!parsed)
        {
          setError(lancamento === 'receita' ? 'Informe valor, ex: salário 4500' : 'Informe valor, ex: café 12,50')
          setSaving(false)
          return
        }

        let titulo = parsed.titulo
        if (recorrencia === 'mensal') titulo = `${titulo} [mensal]`
        if (recorrencia === 'semanal') titulo = `${titulo} [semanal]`
        const data = expenseIso(expenseDate)

        if (lancamento === 'receita')
        {
          const res = await addExpenseFromText(`${titulo} ${parsed.valor}`, isGuest, {
            categoria: 'outros',
            data,
            tipo: 'receita',
            formaPagamento: 'pix',
            folderId: folderId ?? undefined,
            escopo: partnerWs?.partnerUserId ? escopo : 'pessoal',
            partnerWorkspaceId: partnerWs?.workspaceId ?? null,
          })
          if (!res.ok)
          {
            setError(res.error || 'Não foi possível salvar a receita')
            setSaving(false)
            return
          }
        }
        else
        {
          if (pagamento === 'cartao' && !cardId)
          {
            setError('Escolha um cartão')
            setSaving(false)
            return
          }
          const plan = expensePlan(parsed.valor, data)
          // antes de salvar: refaz a conta do mês com o gasto e avisa se apertar
          const seguir = await guardSpend({ launches: plan, cardId: pagamento === 'cartao' ? cardId : null, host: 'capture' })
          if (!seguir)
          {
            setSaving(false)
            return
          }
          // mesmo id em todas as parcelas: dá para editar/apagar a compra inteira depois
          const grupoParcela = (plan[0]?.total ?? 1) > 1
            ? `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
            : undefined
          for (const p of plan)
          {
            const parcelaTitulo = p.total > 1 ? `${titulo} ${p.numero}/${p.total}` : titulo
            const res = pagamento === 'cartao' && cardId
              ? await addCardSpend(cardId, p.valor, parcelaTitulo, isGuest, {
                data: p.data,
                categoria,
                somarFatura: p.offset === 0,
                folderId: folderId ?? undefined,
                grupoParcela,
              })
              : await addExpenseFromText(`${parcelaTitulo} ${p.valor}`, isGuest, {
                lido: { titulo: parcelaTitulo, valor: p.valor },
                categoria,
                data: p.data,
                formaPagamento: pagamento === 'boleto' ? 'boleto' : 'debito',
                folderId: folderId ?? undefined,
                grupoParcela,
                escopo: partnerWs?.partnerUserId ? escopo : 'pessoal',
                pagoContaCasal:
                  Boolean(partnerWs?.partnerUserId)
                  && escopo === 'pessoal'
                  && pagoContaCasal,
                partnerWorkspaceId: partnerWs?.workspaceId ?? null,
              })
            if (!res.ok)
            {
              setError(res.error || (pagamento === 'cartao' ? 'Não foi possível lançar no cartão' : 'Não foi possível salvar o gasto'))
              setSaving(false)
              return
            }
          }
        }

        if (lancamento !== 'receita' && (salvarFixa || recorrencia === 'mensal'))
        {
          const fixaRes = await addContaFixa({
            nome: parsed.titulo,
            valor: parsed.valor,
            categoria,
            isGuest,
          })
          if (!fixaRes.ok)
          {
            setError(fixaRes.error || 'Gasto salvo, mas a fixa falhou')
            setSaving(false)
            return
          }
          // o gasto deste mês acabou de ser lançado: a fixa já conta como paga neste mês
          // (senão a projeção do fim do mês descontaria duas vezes)
          if (fixaRes.id != null)
          {
            useDuePaidStore.getState().setPaid(monthPaidKey('fixa', fixaRes.id, data), true, { titulo: parsed.titulo, valor: parsed.valor })
          }
        }
      }
      else if (kind === 'note')
      {
        const body = text.trim()
        await addHumor(mood ?? 3, body || undefined, isGuest)
        if (body && !isGuest)
        {
          try
          {
            const row = await createNote('diario')
            if (row)
            {
              await updateNote(row.id, {
                titulo: `Humor: ${moodLabel(mood ?? 3)}`,
                conteudo: body,
              })
            }
          }
          catch
          {
            /* humor já persistiu; nota extra é complementar */
          }
        }
      }
      else
      {
        // Dump passa pela revisão (onReviewDump / onSaveDump)
        setSaving(false)
        return
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

  const saveLabel = kind === 'dump'
    ? dumpItems
      ? 'Salvar tudo'
      : dumpReading
        ? 'Lendo...'
        : 'Revisar'
    : promptMode && promptIncluded > 0
      ? `Criar ${promptIncluded} ${promptIncluded === 1 ? 'tarefa' : 'tarefas'}`
      : 'Salvar'

  const dumpMissing = kind === 'dump' && dumpItems ? dumpItemsMissingValue(dumpItems) : 0

  const dumpBody = dumpItems ? (
    <DumpReview items={dumpItems} onChange={setDumpItems} />
  ) : (
    <View style={{ gap: space.sm }}>
      <Field
        label="Conteúdo"
        placeholder={PLACEHOLDERS.dump}
        multiline
        value={text}
        onChangeText={setText}
        editable={!dumpReading}
        style={{
          minHeight: 120,
          textAlignVertical: 'top',
          paddingTop: 14,
        }}
      />
      {dumpReading ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Icon name="sparkles-outline" size={16} color={colors.inkMuted} />
          <Text variant="caption" color={colors.inkMuted}>
            Lendo com calma o que você escreveu...
          </Text>
        </View>
      ) : (
        <Text variant="micro" color={colors.inkMuted}>
          Antes de salvar, você confere e ajusta cada linha.
        </Text>
      )}
    </View>
  )

  // "Organizar com Axel" no rodapé da ficha, na zona do polegar
  const organizeButton = (
    <PrimaryButton
      label="Organizar com Axel"
      disabled={promptState.prompt.trim().length < 2}
      onPress={() => organizeRef.current?.()}
    />
  )

  const primaryAction = (
    <PrimaryButton
      label={saveLabel}
      loading={saving}
      onPress={onPrimary}
      disabled={!canSave()}
      accessibilityLabel={kind === 'dump' && !dumpItems ? 'Revisar o que o app entendeu' : saveLabel}
      style={kind === 'dump' && dumpItems ? { flex: 2 } : undefined}
    />
  )

  const actionRow = kind === 'dump' && dumpItems ? (
    <View style={{ gap: 8 }}>
      {dumpMissing > 0 ? (
        <Text variant="micro" color={colors.attention}>
          {dumpMissing === 1 ? 'Falta o valor em 1 item.' : `Falta o valor em ${dumpMissing} itens.`}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <PrimaryButton
          label="Voltar"
          variant="ghost"
          onPress={() =>
          {
            setDumpItems(null)
            setError(null)
          }}
          disabled={saving}
          accessibilityLabel="Voltar para o texto"
          style={{ flex: 1 }}
        />
        {primaryAction}
      </View>
    </View>
  ) : primaryAction

  const taskBody = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <SelectChip
          label="Descrever (Axel organiza)"
          active={captureMode === 'prompt'}
          onPress={() => patchOrchestratorPrefs({ captureMode: 'prompt' })}
        />
        <SelectChip
          label="Formulário"
          active={captureMode === 'form'}
          onPress={() => patchOrchestratorPrefs({ captureMode: 'form' })}
        />
      </View>
      {captureMode === 'prompt' ? (
        <TaskPromptComposer state={promptState} onChange={setPromptState} organizeRef={organizeRef} />
      ) : (
        <CaptureTaskForm draft={taskDraft} onChange={setTaskDraft} />
      )}
    </View>
  )

  const extraSheets = (
    <Fragment>
      <FinanceCategoriesSheet visible={catsOpen} onClose={() => setCatsOpen(false)} />
      <FinanceFixasSheet visible={fixasOpen} onClose={() => setFixasOpen(false)} />
    </Fragment>
  )

  // No web o Modal fechado ainda pinta o sheet; só monta quando aberto.
  if (!open)
  {
    return extraSheets
  }

  return (
    <Fragment>
      <Modal
        visible
        animationType={studio ? 'fade' : 'slide'}
        transparent
        onRequestClose={resetAndClose}
      >
      {studio ? (
        <ThemeProvider forceMode="dark">
          <CaptureStudioChrome
            open={open}
            title={studioCopy(kind, lancamento).title}
            subtitle={studioCopy(kind, lancamento).subtitle}
            onClose={resetAndClose}
            expanded={promptMode && promptState.result != null}
            footer={(
              <>
                {error ? (
                  <Text variant="caption" color={colors.danger}>
                    {error}
                  </Text>
                ) : null}
                {saved ? (
                  <PrimaryButton label={savedLabel ?? 'Salvo'} variant="success" disabled />
                ) : promptMode && promptIncluded === 0 ? organizeButton : (
                  // no modo Descrever, o botão da vez é "Organizar com Axel": Salvar só depois
                  actionRow
                )}
              </>
            )}
          >
            {kind === 'note' ? <MoodFaceRow value={mood} onChange={setMood} /> : null}
            {kind === 'note' ? (
              <CaptureNoteFields text={text} onTextChange={setText} />
            ) : null}
            {kind === 'task' ? (
              taskBody
            ) : null}
            {kind === 'expense' ? (
              <CaptureExpenseFields
                model={{
                  lancamento,
                  folderId,
                  categoria,
                  pagamento,
                  cardId,
                  salvarFixa,
                  recorrencia,
                  expenseDate,
                  parcelas,
                  porParcela,
                  parcelasPagas,
                  text,
                  escopo,
                  pagoContaCasal,
                }}
                patch={(partial) =>
                {
                  if (partial.lancamento != null) setLancamento(partial.lancamento)
                  if ('folderId' in partial) setFolderId(partial.folderId ?? null)
                  if (partial.categoria != null) setCategoria(partial.categoria)
                  if (partial.pagamento != null) setPagamento(partial.pagamento)
                  if ('cardId' in partial) setCardId(partial.cardId ?? null)
                  if (partial.salvarFixa != null) setSalvarFixa(partial.salvarFixa)
                  if (partial.recorrencia != null) setRecorrencia(partial.recorrencia)
                  if (partial.expenseDate != null) setExpenseDate(partial.expenseDate)
                  if (partial.parcelas != null) setParcelas(partial.parcelas)
                  if (partial.porParcela != null) setPorParcela(partial.porParcela)
                  if (partial.parcelasPagas != null) setParcelasPagas(partial.parcelasPagas)
                  if (partial.text != null) setText(partial.text)
                  if (partial.escopo != null) setEscopo(partial.escopo)
                  if (partial.pagoContaCasal != null) setPagoContaCasal(partial.pagoContaCasal)
                }}
                fixas={contasFixas
                  .filter((f) => f.ativa)
                  .map((f) => ({
                    id: String(f.id),
                    nome: f.nome,
                    valor: f.valor,
                    categoria: f.categoria,
                  }))}
                cards={financeCards.map((c) => ({ id: c.id, nome: c.nome }))}
                folders={folders.map((f) => ({ id: f.id, nome: f.name, color: f.color }))}
                onCreateFolder={(nome) => addFolder(nome)?.id ?? null}
                partnerWs={partnerWs}
                onEditCategories={() => setCatsOpen(true)}
                onEditFixas={() => setFixasOpen(true)}
                spendHint={spendHint}
              />
            ) : null}
            {kind === 'dump' ? dumpBody : null}
          </CaptureStudioChrome>
        </ThemeProvider>
      ) : (
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
              // celular: altura fixa (o teclado sobe por cima); computador: só a altura do conteúdo
              ...(showRail ? { maxHeight: sheetMaxH } : { height: sheetMaxH }),
              flexDirection: 'column',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="section">Captura rápida</Text>
              <CloseButton onPress={resetAndClose} label="Fechar captura" />
            </View>
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
            <ScrollView
              style={showRail ? { flexGrow: 0, flexShrink: 1, minHeight: 0 } : { flex: 1, minHeight: 0 }}
              contentContainerStyle={{ gap: space.md, paddingBottom: 4 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={{ gap: space.md }}>
                {kind === 'note' ? <MoodFaceRow value={mood} onChange={setMood} /> : null}
                {kind === 'task' ? (
                  taskBody
                ) : null}

                {kind === 'expense' ? (
                  <CaptureExpenseFields
                    model={{
                      lancamento,
                      folderId,
                      categoria,
                      pagamento,
                      cardId,
                      salvarFixa,
                      recorrencia,
                      expenseDate,
                      parcelas,
                      porParcela,
                      parcelasPagas,
                      text,
                      escopo,
                      pagoContaCasal,
                    }}
                    patch={(partial) =>
                    {
                      if (partial.lancamento != null) setLancamento(partial.lancamento)
                      if ('folderId' in partial) setFolderId(partial.folderId ?? null)
                      if (partial.categoria != null) setCategoria(partial.categoria)
                      if (partial.pagamento != null) setPagamento(partial.pagamento)
                      if ('cardId' in partial) setCardId(partial.cardId ?? null)
                      if (partial.salvarFixa != null) setSalvarFixa(partial.salvarFixa)
                      if (partial.recorrencia != null) setRecorrencia(partial.recorrencia)
                      if (partial.expenseDate != null) setExpenseDate(partial.expenseDate)
                      if (partial.parcelas != null) setParcelas(partial.parcelas)
                      if (partial.porParcela != null) setPorParcela(partial.porParcela)
                      if (partial.parcelasPagas != null) setParcelasPagas(partial.parcelasPagas)
                      if (partial.text != null) setText(partial.text)
                      if (partial.escopo != null) setEscopo(partial.escopo)
                      if (partial.pagoContaCasal != null) setPagoContaCasal(partial.pagoContaCasal)
                    }}
                    fixas={contasFixas
                      .filter((f) => f.ativa)
                      .map((f) => ({
                        id: String(f.id),
                        nome: f.nome,
                        valor: f.valor,
                        categoria: f.categoria,
                      }))}
                    cards={financeCards.map((c) => ({ id: c.id, nome: c.nome }))}
                    folders={folders.map((f) => ({ id: f.id, nome: f.name, color: f.color }))}
                    onCreateFolder={(nome) => addFolder(nome)?.id ?? null}
                    partnerWs={partnerWs}
                    onEditCategories={() => setCatsOpen(true)}
                    onEditFixas={() => setFixasOpen(true)}
                    spendHint={spendHint}
                  />
                ) : null}

                {kind === 'note' ? (
                  <CaptureNoteFields text={text} onTextChange={setText} />
                ) : null}

                {kind === 'dump' ? dumpBody : null}
              </View>
            </ScrollView>
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
                  {savedLabel ?? 'Salvo'}
                </Text>
              </View>
            ) : promptMode && promptIncluded === 0 ? organizeButton : (
              actionRow
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      )}
      <SpendGuardHost host="capture" />
      </Modal>
      {extraSheets}
    </Fragment>
  )
}

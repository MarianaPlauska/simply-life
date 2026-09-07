import {
  Modal,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useEffect, useState, Fragment } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, PrimaryButton, PillTabs, Field } from '../ui'
import { useTheme, ThemeProvider } from '../theme/ThemeProvider'
import { useCaptureStore, type CaptureKind } from '../store/captureStore'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { hapticLight } from '../lib/haptics'
import { MoodFaceRow } from './MoodFace'
import {
  fetchPartnerWorkspace,
  type PartnerWorkspaceState,
} from '../lib/partnerWorkspace'
import { applyTaskMeta, todayIso, isoMonthsFrom, type FinanceCategory, type FinanceEscopo } from '@simply-life/shared'
import { parseExpenseQuick } from '../lib/sync/finance'
import { FinanceCategoriesSheet } from './finance/FinanceCategoriesSheet'
import { FinanceFixasSheet } from './finance/FinanceFixasSheet'
import {
  CaptureTaskForm,
  emptyCaptureTaskDraft,
  parseCaptureHora,
  type CaptureTaskDraft,
} from './CaptureTaskForm'
import { CaptureStudioChrome } from './CaptureStudioChrome'
import { useKanbanListsStore } from '../store/kanbanListsStore'

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

type Pagamento = 'conta' | 'cartao'
type Recorrencia = 'nenhuma' | 'mensal' | 'semanal'

function splitCents(total: number, n: number): number[]
{
  const parts = Math.max(1, Math.round(n))
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / parts)
  const rem = cents - base * parts
  return Array.from({ length: parts }, (_, i) => (base + (i < rem ? 1 : 0)) / 100)
}

function studioCopy(
  kind: CaptureKind,
  lancamento: 'despesa' | 'receita',
): { title: string; subtitle: string }
{
  if (kind === 'task')
  {
    return {
      title: 'Nova tarefa',
      subtitle: 'Título, to-dos e contexto — no ritmo de um editor, não de um dump.',
    }
  }
  if (kind === 'expense')
  {
    if (lancamento === 'receita')
    {
      return {
        title: 'Nova receita',
        subtitle: 'O que entrou na conta — salário, extra, transferência.',
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
      title: 'Como você está',
      subtitle: 'Humor e um recado para o diário.',
    }
  }
  return { title: 'Captura', subtitle: 'Uma linha por item.' }
}

function expenseIso(raw: string): string
{
  return /^\d{4}-\d{2}-\d{2}$/.test(raw.trim()) ? raw.trim() : todayIso()
}

export function CaptureSheet()
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
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
  const commitDump = useDataStore((s) => s.commitDump)
  const contasFixas = useDataStore((s) => s.contasFixas)
  const financeCards = useDataStore((s) => s.financeCards)
  const folders = useKanbanListsStore((s) => s.lists)
  const hydrateFolders = useKanbanListsStore((s) => s.hydrate)
  const addFolder = useKanbanListsStore((s) => s.addList)

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
  const [taskDraft, setTaskDraft] = useState<CaptureTaskDraft>(() => emptyCaptureTaskDraft(null))

  useEffect(() =>
  {
    if (open) hydrateFolders()
  }, [open, hydrateFolders])

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
    setLancamento('despesa')
    setTaskDraft(emptyCaptureTaskDraft(null))
    closeCapture()
  }

  const onSave = async () =>
  {
    if (kind === 'task')
    {
      if (!taskDraft.titulo.trim()) return
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
      if (kind === 'task')
      {
        const notas = applyTaskMeta(taskDraft.descricao, taskDraft.listId, taskDraft.dependsOnId)
        const n = Number(taskDraft.estimativa)
        await addTask(taskDraft.titulo.trim(), isGuest, notas, {
          dataVencimento: taskDraft.due.trim() || null,
          horaMinutos: parseCaptureHora(taskDraft.hora),
          estimativaMinutos: Number.isFinite(n) && n > 0 ? Math.round(n) : 30,
          prioridade: taskDraft.prioridade,
          status: taskDraft.status,
          checklist: taskDraft.checklist,
        })
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
        else if (pagamento === 'cartao')
        {
          if (!cardId)
          {
            setError('Escolha um cartão')
            setSaving(false)
            return
          }
          const n = Math.max(1, Math.round(parcelas))
          const valores = splitCents(parsed.valor, n)
          const baseDate = data
          for (let i = 0; i < n; i += 1)
          {
            const parcelaTitulo = n > 1 ? `${titulo} ${i + 1}/${n}` : titulo
            const res = await addCardSpend(cardId, valores[i] ?? parsed.valor, parcelaTitulo, isGuest, {
              data: isoMonthsFrom(baseDate, i),
              categoria,
              somarFatura: i === 0,
              folderId: folderId ?? undefined,
            })
            if (!res.ok)
            {
              setError(res.error || 'Não foi possível lançar no cartão')
              setSaving(false)
              return
            }
          }
        }
        else
        {
          const res = await addExpenseFromText(`${titulo} ${parsed.valor}`, isGuest, {
            categoria,
            data,
            formaPagamento: 'debito',
            folderId: folderId ?? undefined,
            escopo: partnerWs?.partnerUserId ? escopo : 'pessoal',
            pagoContaCasal:
              Boolean(partnerWs?.partnerUserId)
              && escopo === 'pessoal'
              && pagoContaCasal,
            partnerWorkspaceId: partnerWs?.workspaceId ?? null,
          })
          if (!res.ok)
          {
            setError(res.error || 'Não foi possível salvar o gasto')
            setSaving(false)
            return
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
    <Fragment>
    <Modal visible={open} animationType={studio ? 'fade' : 'slide'} transparent onRequestClose={resetAndClose}>
      {studio ? (
        <ThemeProvider forceMode="light">
          <CaptureStudioChrome
            open={open}
            title={studioCopy(kind, lancamento).title}
            subtitle={studioCopy(kind, lancamento).subtitle}
            onClose={resetAndClose}
            footer={(
              <>
                {error ? (
                  <Text variant="caption" color={colors.danger}>
                    {error}
                  </Text>
                ) : null}
                {saved ? (
                  <PrimaryButton label="Salvo" variant="success" disabled />
                ) : (
                  <PrimaryButton
                    label="Salvar"
                    loading={saving}
                    onPress={() => void onSave()}
                    disabled={(kind === 'task' ? !taskDraft.titulo.trim() : !text.trim()) || saving}
                  />
                )}
              </>
            )}
          >
            {kind === 'note' ? <MoodFaceRow value={mood} onChange={setMood} /> : null}
            {kind === 'task' ? (
              <CaptureTaskForm draft={taskDraft} onChange={setTaskDraft} />
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
              />
            ) : null}
            {kind !== 'task' && kind !== 'expense' ? (
              <Field
                label="Conteúdo"
                placeholder={PLACEHOLDERS[kind]}
                multiline
                value={text}
                onChangeText={setText}
                style={{
                  minHeight: 120,
                  textAlignVertical: 'top',
                  paddingTop: 14,
                }}
              />
            ) : null}
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
              minHeight: kind === 'task' ? 420 : 320,
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
            <ScrollView
              style={{ maxHeight: kind === 'expense' || kind === 'task' ? 440 : undefined }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ gap: space.md }}>
                {kind === 'task' ? (
                  <CaptureTaskForm draft={taskDraft} onChange={setTaskDraft} />
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
                  />
                ) : null}

                {kind !== 'task' && kind !== 'expense' ? (
                <Field
                  label="Conteúdo"
                  placeholder={PLACEHOLDERS[kind]}
                  multiline
                  value={text}
                  onChangeText={setText}
                  style={{
                    minHeight: 120,
                    textAlignVertical: 'top',
                    paddingTop: 14,
                  }}
                />
                ) : null}
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
                  Salvo
                </Text>
              </View>
            ) : (
              <PrimaryButton
                label="Salvar"
                loading={saving}
                onPress={() => void onSave()}
                disabled={(kind === 'task' ? !taskDraft.titulo.trim() : !text.trim()) || saving}
              />
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      )}
    </Modal>
    <FinanceCategoriesSheet visible={catsOpen} onClose={() => setCatsOpen(false)} />
    <FinanceFixasSheet visible={fixasOpen} onClose={() => setFixasOpen(false)} />
    </Fragment>
  )
}

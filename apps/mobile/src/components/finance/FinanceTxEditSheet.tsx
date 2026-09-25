import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatBRL, installmentGroupOf, parseBrlNumber, type FinanceCategory } from '@simply-life/shared'
import { Text, Field, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { defaultCategoryMeta, visibleCategoryIds } from '../../lib/categoryMeta'
import { confirmDestructive } from '../../lib/confirmDestructive'
import { SelectChip } from '../CaptureTaskForm'

type Props = {
  txId: string | null
  onClose: () => void
}

/**
 * Editar ou apagar um lançamento (Etapa 1 de integridade).
 * Antes não havia como corrigir valor errado nem tirar um lançamento duplicado.
 */
export function FinanceTxEditSheet({ txId, onClose }: Props)
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const isGuest = useAuthStore((s) => s.isGuest)
  const tx = useDataStore((s) => s.finance.find((t) => t.id === txId) ?? null)
  const updateFinanceTx = useDataStore((s) => s.updateFinanceTx)
  const removeFinanceTx = useDataStore((s) => s.removeFinanceTx)
  const removeFinanceTxs = useDataStore((s) => s.removeFinanceTxs)
  const finance = useDataStore((s) => s.finance)
  // compra parcelada: todas as parcelas da mesma compra (novas pelo grupo, antigas pelo "N/M")
  const group = useMemo(() => (tx ? installmentGroupOf(finance, tx) : null), [finance, tx])
  const [applyToNext, setApplyToNext] = useState(false)
  const catMap = useCategoryMetaStore((s) => s.map)
  const [titulo, setTitulo] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [categoria, setCategoria] = useState<FinanceCategory>('outros')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() =>
  {
    if (!tx) return
    setTitulo(tx.titulo)
    setValor(String(tx.valor).replace('.', ','))
    setData(tx.data)
    setTipo(tx.tipo)
    setCategoria(tx.categoria)
    setError(null)
  }, [tx])

  const categorias = useMemo(() =>
  {
    const ids = visibleCategoryIds(catMap)
    if (tx && !ids.includes(tx.categoria)) ids.push(tx.categoria)
    return ids.map((id) => ({ id, label: catMap[id]?.label ?? defaultCategoryMeta(id).label }))
  }, [catMap, tx])

  if (!txId || !tx) return null

  const save = async () =>
  {
    const v = parseBrlNumber(valor)
    if (!titulo.trim()) return setError('Escreva uma descrição')
    if (v == null) return setError('Valor inválido. Ex.: 45,90')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setError('Data no formato AAAA-MM-DD')
    setSaving(true)
    const res = await updateFinanceTx(tx.id, { titulo: titulo.trim(), valor: v, data, tipo, categoria }, isGuest)
    if (res.ok && group && applyToNext)
    {
      // mesmas mudanças de valor/categoria nas próximas parcelas (título e data de cada uma ficam)
      for (const next of group.restantes)
      {
        const r = await updateFinanceTx(next.id, { valor: v, categoria }, isGuest)
        if (!r.ok)
        {
          setSaving(false)
          return setError(r.error ?? 'Algumas parcelas não foram atualizadas')
        }
      }
    }
    setSaving(false)
    if (res.ok) onClose()
    else setError(res.error ?? 'Não consegui salvar')
  }

  const removeMany = (ids: string[], label: string) =>
  {
    confirmDestructive(label, `${ids.length} ${ids.length === 1 ? 'parcela sai' : 'parcelas saem'} do extrato e dos relatórios.`, () =>
    {
      void removeFinanceTxs(ids, isGuest).then((res) =>
      {
        if (res.ok) onClose()
        else setError(res.error ?? 'Não consegui apagar')
      })
    })
  }

  const remove = () =>
  {
    confirmDestructive('Apagar lançamento', `"${tx.titulo}" sai do extrato e dos relatórios.`, () =>
    {
      void removeFinanceTx(tx.id, isGuest).then((res) =>
      {
        if (res.ok) onClose()
        else setError(res.error ?? 'Não consegui apagar')
      })
    })
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: '88%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}
        >
          <ScrollView contentContainerStyle={{ gap: space.md }} keyboardShouldPersistTaps="handled">
            <Text variant="section">Editar lançamento</Text>
            {group ? (
              <View style={{ gap: 6, padding: 12, borderRadius: 14, backgroundColor: colors.hairline }}>
                <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                  Compra parcelada · parcela {group.atual} de {group.total}
                </Text>
                <Text variant="caption" muted>
                  {group.titulo} · {formatBRL(group.valorParcela)} por mês
                  {group.restantes.length
                    ? ` · faltam ${group.restantes.length} (${formatBRL(group.valorRestante)})`
                    : ' · esta é a última'}
                </Text>
                {group.restantes.length ? (
                  <SelectChip
                    label="Aplicar valor e categoria às próximas parcelas"
                    active={applyToNext}
                    onPress={() => setApplyToNext(!applyToNext)}
                  />
                ) : null}
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SelectChip label="Gasto" active={tipo === 'despesa'} onPress={() => setTipo('despesa')} />
              <SelectChip label="Receita" active={tipo === 'receita'} onPress={() => setTipo('receita')} />
            </View>
            <Field label="Descrição" value={titulo} onChangeText={setTitulo} />
            <Field label="Valor (R$)" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
            <Field label="Data (AAAA-MM-DD)" value={data} onChangeText={setData} autoCapitalize="none" />
            <Text variant="caption" muted>Categoria</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categorias.map((c) => (
                <SelectChip key={c.id} label={c.label} active={categoria === c.id} onPress={() => setCategoria(c.id)} />
              ))}
            </View>
            {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
            <PrimaryButton label="Salvar" loading={saving} onPress={() => void save()} />
            {group ? (
              <>
                {group.restantes.length ? (
                  <PrimaryButton
                    label={`Apagar esta e as próximas (${group.restantes.length + 1})`}
                    variant="secondary"
                    onPress={() => removeMany([tx.id, ...group.restantes.map((t) => t.id)], 'Apagar parcelas')}
                  />
                ) : null}
                <PrimaryButton
                  label={`Apagar a compra inteira (${group.parcelas.length} parcelas)`}
                  variant="danger"
                  onPress={() => removeMany(group.parcelas.map((t) => t.id), 'Apagar compra parcelada')}
                />
                <PrimaryButton label="Apagar só esta parcela" variant="ghost" onPress={remove} />
              </>
            ) : (
              <PrimaryButton label="Apagar lançamento" variant="danger" onPress={remove} />
            )}
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

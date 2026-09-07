import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  formatBRL,
  type FinanceCategory,
} from '@simply-life/shared'
import { Text, Field, PrimaryButton, ListRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useFixaMetaStore } from '../../store/fixaMetaStore'
import {
  FIXA_URGENCIA_LABELS,
  defaultFixaColor,
  defaultFixaIcon,
  type FixaUrgencia,
} from '../../lib/fixaMeta'
import { FinanceColorSwatches } from './FinanceColorSwatches'
import { ExpenseCategoryChips } from './ExpenseCategoryChips'
import { LucideIconPicker } from './LucideIconPicker'
import { LucideFinanceIcon } from '../../lib/lucideFinanceIcons'

type Props = {
  visible: boolean
  onClose: () => void
}

type Editing = number | 'new' | null

function parseMoney(raw: string): number
{
  return Number(raw.replace(/\s/g, '').replace(',', '.'))
}

/** Editar contas fixas: nome, valor, vencimento, cor e urgência */
export function FinanceFixasSheet({ visible, onClose }: Props)
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const isGuest = useAuthStore((s) => s.isGuest)
  const fixas = useDataStore((s) => s.contasFixas)
  const addContaFixa = useDataStore((s) => s.addContaFixa)
  const patchContaFixa = useDataStore((s) => s.patchContaFixa)
  const hydrate = useFixaMetaStore((s) => s.hydrate)
  const resolve = useFixaMetaStore((s) => s.resolve)
  const patchMeta = useFixaMetaStore((s) => s.patch)
  const map = useFixaMetaStore((s) => s.map)

  const [editing, setEditing] = useState<Editing>(null)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [dia, setDia] = useState('5')
  const [categoria, setCategoria] = useState<FinanceCategory>('outros')
  const [color, setColor] = useState('#E8734A')
  const [icon, setIcon] = useState(defaultFixaIcon('outros'))
  const [urgencia, setUrgencia] = useState<FixaUrgencia>(2)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    if (visible) void hydrate()
    else setEditing(null)
  }, [visible, hydrate])

  useEffect(() =>
  {
    if (editing == null || editing === 'new') return
    const conta = fixas.find((c) => c.id === editing)
    if (!conta) return
    const meta = resolve(conta.id, conta.categoria)
    setNome(conta.nome)
    setValor(String(conta.valor).replace('.', ','))
    setDia(String(conta.diaVencimento))
    setCategoria((conta.categoria as FinanceCategory) || 'outros')
    setColor(meta.color)
    setIcon(meta.icon)
    setUrgencia(meta.urgencia)
    setError(null)
  }, [editing, fixas, resolve, map])

  const startNew = () =>
  {
    setEditing('new')
    setNome('')
    setValor('')
    setDia(String(new Date().getDate()))
    setCategoria('outros')
    setColor(defaultFixaColor('outros'))
    setIcon(defaultFixaIcon('outros'))
    setUrgencia(2)
    setError(null)
  }

  const onSave = async () =>
  {
    const n = parseMoney(valor)
    const d = Math.min(31, Math.max(1, Number(dia) || 1))
    if (!nome.trim() || !(n > 0))
    {
      setError('Informe nome e valor')
      return
    }
    setSaving(true)
    setError(null)
    try
    {
      if (editing === 'new')
      {
        const res = await addContaFixa({
          nome: nome.trim(),
          valor: n,
          categoria,
          diaVencimento: d,
          isGuest,
        })
        if (!res.ok || res.id == null)
        {
          setError(res.error || 'Não foi possível criar')
          return
        }
        await patchMeta(res.id, { color, urgencia, icon })
      }
      else if (typeof editing === 'number')
      {
        const res = await patchContaFixa(
          editing,
          {
            nome: nome.trim(),
            valor: n,
            diaVencimento: d,
            categoria,
          },
          isGuest,
        )
        if (!res.ok)
        {
          setError(res.error || 'Não foi possível salvar')
          return
        }
        await patchMeta(editing, { color, urgencia, icon })
      }
      setEditing(null)
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            padding: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
            maxHeight: '88%',
            gap: space.md,
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
          <Text variant="section">
            {editing == null ? 'Contas fixas' : editing === 'new' ? 'Nova conta fixa' : 'Editar conta fixa'}
          </Text>
          <Text variant="caption" muted>
            Cor, ícone e urgência ficam neste aparelho; o restante sincroniza com a conta.
          </Text>

          {editing != null ? (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 440 }}>
              <View style={{ gap: space.md }}>
                <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Aluguel" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Valor"
                      value={valor}
                      onChangeText={setValor}
                      keyboardType="decimal-pad"
                      placeholder="2200,00"
                    />
                  </View>
                  <View style={{ width: 96 }}>
                    <Field
                      label="Dia"
                      value={dia}
                      onChangeText={setDia}
                      keyboardType="number-pad"
                      placeholder="5"
                    />
                  </View>
                </View>
                <ExpenseCategoryChips
                  value={categoria}
                  onChange={(id) =>
                  {
                    setIcon((prev) =>
                      prev === defaultFixaIcon(categoria) ? defaultFixaIcon(id) : prev,
                    )
                    setCategoria(id)
                  }}
                />
                <FinanceColorSwatches value={color} onChange={setColor} />
                <LucideIconPicker value={icon} onChange={setIcon} />
                <Text variant="caption" muted>
                  Urgência
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {([1, 2, 3] as FixaUrgencia[]).map((u) =>
                  {
                    const active = urgencia === u
                    const accent = u === 1 ? colors.danger : u === 3 ? colors.inkMuted : colors.axel
                    return (
                      <Pressable
                        key={u}
                        onPress={() => setUrgencia(u)}
                        accessibilityState={{ selected: active }}
                        style={{
                          minHeight: 44,
                          paddingHorizontal: 14,
                          borderRadius: 999,
                          justifyContent: 'center',
                          backgroundColor: active ? `${accent}33` : colors.elevated,
                          borderWidth: 1,
                          borderColor: active ? accent : colors.hairline,
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ fontWeight: '600', color: active ? colors.ink : colors.inkMuted }}
                        >
                          {FIXA_URGENCIA_LABELS[u]}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                {error ? (
                  <Text variant="caption" color={colors.danger}>
                    {error}
                  </Text>
                ) : null}
                <PrimaryButton
                  label="Salvar conta"
                  loading={saving}
                  disabled={saving}
                  onPress={() => void onSave()}
                />
                <PrimaryButton
                  label="Voltar"
                  variant="ghost"
                  onPress={() => setEditing(null)}
                />
              </View>
            </ScrollView>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 360 }}>
                {fixas.length === 0 ? (
                  <Text variant="caption" muted>
                    Nenhuma conta fixa ainda.
                  </Text>
                ) : (
                  fixas.map((conta, i) =>
                  {
                    const meta = resolve(conta.id, conta.categoria)
                    void map
                    return (
                      <View
                        key={conta.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${meta.color}33`,
                          }}
                        >
                          <LucideFinanceIcon name={meta.icon} size={18} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ListRow
                            title={conta.nome}
                            subtitle={`Dia ${conta.diaVencimento} · ${FIXA_URGENCIA_LABELS[meta.urgencia]}`}
                            right={formatBRL(conta.valor)}
                            showSeparator={i < fixas.length - 1}
                            onPress={() => setEditing(conta.id)}
                          />
                        </View>
                      </View>
                    )
                  })
                )}
              </ScrollView>
              <PrimaryButton label="Nova conta fixa" variant="secondary" onPress={startNew} />
              <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

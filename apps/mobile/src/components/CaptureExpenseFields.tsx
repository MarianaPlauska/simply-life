import { Pressable, ScrollView, View } from 'react-native'
import { useState } from 'react'
import { todayIso, isoDaysFromNow, type FinanceCategory, type FinanceEscopo } from '@simply-life/shared'
import { Field, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { ExpenseCategoryChips, ExpenseFixasChips } from './finance/ExpenseCategoryChips'
import type { PartnerWorkspaceState } from '../lib/partnerWorkspace'

type Pagamento = 'conta' | 'cartao'
type Recorrencia = 'nenhuma' | 'mensal' | 'semanal'

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
})
{
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 12,
        borderRadius: 999,
        justifyContent: 'center',
        backgroundColor: active ? colors.axelMuted : colors.hairline,
        borderWidth: 1,
        borderColor: active ? colors.axel : colors.hairline,
      }}
    >
      <Text
        variant="caption"
        style={{ fontWeight: '600', color: active ? colors.ink : colors.inkMuted }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export type CaptureExpenseModel = {
  lancamento: 'despesa' | 'receita'
  categoria: FinanceCategory
  pagamento: Pagamento
  cardId: string | null
  folderId: string | null
  salvarFixa: boolean
  recorrencia: Recorrencia
  expenseDate: string
  parcelas: number
  text: string
  escopo: FinanceEscopo
  pagoContaCasal: boolean
}

type FixaChip = { id: string; nome: string; valor: number; categoria: string }
type CardChip = { id: string; nome: string }
type FolderChip = { id: string; nome: string; color?: string }

type Props = {
  model: CaptureExpenseModel
  patch: (partial: Partial<CaptureExpenseModel>) => void
  fixas: FixaChip[]
  cards: CardChip[]
  folders: FolderChip[]
  onCreateFolder?: (nome: string) => string | null
  partnerWs: PartnerWorkspaceState | null
  onEditCategories: () => void
  onEditFixas: () => void
}

/** Campos de gasto — usados na captura rápida e no studio da Carteira. */
export function CaptureExpenseFields({
  model,
  patch,
  fixas,
  cards,
  folders,
  onCreateFolder,
  partnerWs,
  onEditCategories,
  onEditFixas,
}: Props)
{
  const { colors, space } = useTheme()
  const [novaPasta, setNovaPasta] = useState('')
  const { lancamento, categoria, pagamento, cardId, folderId, salvarFixa, recorrencia, expenseDate, parcelas, text, escopo, pagoContaCasal } = model
  const isReceita = lancamento === 'receita'

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Tipo
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <ChoiceChip
            label="Gasto"
            active={!isReceita}
            onPress={() => patch({ lancamento: 'despesa' })}
          />
          <ChoiceChip
            label="Receita"
            active={isReceita}
            onPress={() => patch({ lancamento: 'receita', pagamento: 'conta', parcelas: 1 })}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Pasta — gastos da mesma história ficam juntos
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ChoiceChip
              label="Sem pasta"
              active={!folderId}
              onPress={() => patch({ folderId: null })}
            />
            {folders.map((f) => (
              <ChoiceChip
                key={f.id}
                label={f.nome}
                active={folderId === f.id}
                onPress={() => patch({ folderId: f.id })}
              />
            ))}
          </View>
        </ScrollView>
        {onCreateFolder ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field
                tone="sand"
                label="Nova pasta"
                value={novaPasta}
                placeholder="Ex: Viagem, reforma, casamento"
                onChangeText={setNovaPasta}
              />
            </View>
            <Pressable
              onPress={() =>
              {
                const id = onCreateFolder(novaPasta)
                if (id)
                {
                  patch({ folderId: id })
                  setNovaPasta('')
                }
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: 12,
                justifyContent: 'center',
                backgroundColor: colors.axelMuted,
              }}
            >
              <Text variant="caption" style={{ fontWeight: '700' }}>
                Criar
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!isReceita ? (
      <>
      <ExpenseCategoryChips
        value={categoria}
        onChange={(next) => patch({ categoria: next })}
        onEditCategories={onEditCategories}
      />
      <ExpenseFixasChips
        fixas={fixas}
        onEditFixas={onEditFixas}
        onPick={(fixa) =>
        {
          const valorStr = Number(fixa.valor).toFixed(2).replace('.', ',')
          const cat = String(fixa.categoria || '').toLowerCase()
          patch({
            text: `${fixa.nome} ${valorStr}`,
            salvarFixa: false,
            recorrencia: 'mensal',
            ...(cat ? { categoria: cat as FinanceCategory } : {}),
          })
        }}
      />

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Forma de pagamento
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <ChoiceChip
            label="Conta"
            active={pagamento === 'conta'}
            onPress={() => patch({ pagamento: 'conta' })}
          />
          <ChoiceChip
            label="Cartão de crédito"
            active={pagamento === 'cartao'}
            onPress={() => patch({ pagamento: 'cartao' })}
          />
        </View>
      </View>

      {pagamento === 'cartao' ? (
        <View style={{ gap: 8 }}>
          <Text variant="caption" muted>
            Cartão
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {cards.length === 0 ? (
                <Text variant="caption" muted>
                  Cadastre um cartão em Contas → Cartões
                </Text>
              ) : (
                cards.map((c) => (
                  <ChoiceChip
                    key={c.id}
                    label={c.nome}
                    active={cardId === c.id}
                    onPress={() => patch({ cardId: c.id })}
                  />
                ))
              )}
            </View>
          </ScrollView>
          <Text variant="caption" muted>
            Parcelar
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([1, 2, 3, 4, 6] as const).map((n) => (
                <ChoiceChip
                  key={n}
                  label={n === 1 ? 'À vista' : `${n}x`}
                  active={parcelas === n}
                  onPress={() => patch({ parcelas: n })}
                />
              ))}
            </View>
          </ScrollView>
          <Text variant="caption" muted>
            {parcelas > 1
              ? `${parcelas} parcelas mensais a partir da data. Mais do que 6x: edite os lançamentos depois.`
              : 'Até 6x aqui. O restante você ajusta editando o lançamento.'}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Recorrência
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <ChoiceChip
            label="Única"
            active={recorrencia === 'nenhuma'}
            onPress={() => patch({ recorrencia: 'nenhuma' })}
          />
          <ChoiceChip
            label="Mensal"
            active={recorrencia === 'mensal'}
            onPress={() => patch({ recorrencia: 'mensal', salvarFixa: true })}
          />
          <ChoiceChip
            label="Semanal"
            active={recorrencia === 'semanal'}
            onPress={() => patch({ recorrencia: 'semanal' })}
          />
        </View>
      </View>
      </>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Quando aconteceu (ou vai acontecer)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <ChoiceChip
            label="Hoje"
            active={expenseDate === todayIso()}
            onPress={() => patch({ expenseDate: todayIso() })}
          />
          <ChoiceChip
            label="Ontem"
            active={expenseDate === isoDaysFromNow(-1)}
            onPress={() => patch({ expenseDate: isoDaysFromNow(-1) })}
          />
          <ChoiceChip
            label="Amanhã"
            active={expenseDate === isoDaysFromNow(1)}
            onPress={() => patch({ expenseDate: isoDaysFromNow(1) })}
          />
        </View>
        <Field
          tone="sand"
          label="Data (AAAA-MM-DD)"
          value={expenseDate}
          placeholder="2026-09-10"
          onChangeText={(expenseDate) => patch({ expenseDate })}
        />
      </View>

      {!isReceita ? (
      <Pressable
        onPress={() => patch({ salvarFixa: !salvarFixa })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: salvarFixa }}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          minHeight: 48,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            marginTop: 2,
            borderRadius: 4,
            borderWidth: salvarFixa ? 0 : 1.5,
            borderColor: colors.ink,
            backgroundColor: salvarFixa ? colors.axel : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {salvarFixa ? (
            <Text variant="micro" style={{ color: '#373539' }}>
              ✓
            </Text>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={{ fontSize: 13 }}>
            Adicionar em Contas fixas
          </Text>
          <Text variant="caption" muted>
            Cria ou reforça o item em Contas → Fixas para o próximo mês.
          </Text>
        </View>
      </Pressable>
      ) : null}

      <Field
        tone="sand"
        label={isReceita ? 'O que entrou e o valor' : 'Descrição e valor'}
        placeholder={isReceita ? 'Ex: salário 4500' : 'Ex: café 12,50'}
        multiline
        value={text}
        onChangeText={(next) => patch({ text: next })}
        style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: 14 }}
      />

      {partnerWs?.partnerUserId ? (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted>
            Escopo do gasto
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([
              { id: 'pessoal' as const, label: 'Pessoal', hint: 'Só você' },
              {
                id: 'casal' as const,
                label: 'Casal',
                hint: partnerWs.partnerDisplayName ?? 'Parceiro',
              },
            ]).map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() =>
                  patch({
                    escopo: opt.id,
                    ...(opt.id === 'casal' ? { pagoContaCasal: false } : {}),
                  })
                }
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: escopo === opt.id ? colors.axel : colors.hairline,
                  backgroundColor: escopo === opt.id ? colors.axelMuted : colors.elevated,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  justifyContent: 'center',
                }}
              >
                <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                  {opt.label}
                </Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {opt.hint}
                </Text>
              </Pressable>
            ))}
          </View>
          {escopo === 'pessoal' ? (
            <Pressable
              onPress={() => patch({ pagoContaCasal: !pagoContaCasal })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: pagoContaCasal }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                minHeight: 48,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  marginTop: 2,
                  borderRadius: 4,
                  borderWidth: pagoContaCasal ? 0 : 1.5,
                  borderColor: colors.ink,
                  backgroundColor: pagoContaCasal ? colors.axel : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pagoContaCasal ? (
                  <Text variant="micro" style={{ color: '#373539' }}>
                    ✓
                  </Text>
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" style={{ fontSize: 13 }}>
                  Pago na conta do casal
                </Text>
                <Text variant="caption" muted>
                  Continua pessoal, mas marca que o valor saiu da conta compartilhada.
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

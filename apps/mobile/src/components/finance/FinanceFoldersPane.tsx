import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  txsForFolder,
} from '@simply-life/shared'
import { Card, Text, EmptyState, PrimaryButton, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { FolderGlyph } from '../kanban/FolderGlyph'

/** Mesmas pastas das tarefas — gastos relacionados compartilham histórico. */
export function FinanceFoldersPane()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const txs = useDataStore((s) => s.finance)
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const loose = useMemo(() => txsForFolder(txs, 'loose'), [txs])
  const rows = useMemo(
    () =>
      lists.map((list) =>
      {
        const items = txsForFolder(txs, list.id)
        return {
          list,
          items,
          gasto: monthExpenseTotal(items),
          receita: monthIncomeTotal(items),
        }
      }),
    [lists, txs],
  )

  return (
    <View style={{ gap: space.md }}>
      <Text variant="caption" muted>
        São as mesmas pastas das tarefas. Um gasto de viagem, reforma ou projeto fica junto do resto.
      </Text>
      <PrimaryButton
        label="Nova pasta"
        size="sm"
        variant="secondary"
        onPress={() =>
        {
          const created = addList('Nova pasta')
          if (created) router.push(`/pasta/${created.id}` as never)
        }}
      />
      {rows.map((row) => (
        <PressableScale
          key={row.list.id}
          onPress={() => router.push(`/pasta/${row.list.id}` as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 72,
            padding: 12,
            borderRadius: 18,
            backgroundColor: colors.elevated,
          }}
        >
          <FolderGlyph color={row.list.color} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{row.list.name}</Text>
            <Text variant="caption" muted>
              {row.items.length} lançamento{row.items.length === 1 ? '' : 's'}
              {row.gasto > 0 ? ` · gasto ${formatBRL(row.gasto)}` : ''}
              {row.receita > 0 ? ` · entra ${formatBRL(row.receita)}` : ''}
            </Text>
          </View>
        </PressableScale>
      ))}
      {loose.length > 0 ? (
        <Card tone="inset" style={{ gap: 6 }}>
          <Text variant="bodyStrong">Sem pasta</Text>
          <Text variant="caption" muted>
            {loose.length} lançamento{loose.length === 1 ? '' : 's'} ainda soltos · {formatBRL(monthExpenseTotal(loose))}
          </Text>
        </Card>
      ) : null}
      {lists.length === 0 ? (
        <EmptyState
          title="Nenhuma pasta ainda"
          body="Crie uma pasta (Viagem, reforma, casamento) e jogue os gastos relacionados lá."
          icon="folder-outline"
        />
      ) : null}
    </View>
  )
}

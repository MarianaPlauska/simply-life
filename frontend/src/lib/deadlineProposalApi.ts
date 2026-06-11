import { supabase } from './supabase'
import type { DeadlineProposal } from './deadlineProposal'

interface DbProposalRow
{
  id: string
  task_id: number
  current_due: string | null
  proposed_due: string
  reason: string
  status: string
  created_at: string
}

function rowToProposal(row: DbProposalRow): DeadlineProposal
{
  return {
    taskId: row.task_id,
    currentDue: row.current_due,
    proposedDue: row.proposed_due,
    reason: row.reason,
    createdAt: row.created_at,
  }
}

export async function fetchPendingDeadlineProposals(): Promise<Record<number, DeadlineProposal>>
{
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('deadline_proposals')
    .select('id, task_id, current_due, proposed_due, reason, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error || !data)
  {
    return {}
  }

  const map: Record<number, DeadlineProposal> = {}
  for (const row of data as DbProposalRow[])
  {
    map[row.task_id] = rowToProposal(row)
  }

  return map
}

export async function upsertDeadlineProposals(proposals: DeadlineProposal[]): Promise<void>
{
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || proposals.length === 0) return

  const rows = proposals.map((p) => ({
    user_id: user.id,
    task_id: p.taskId,
    current_due: p.currentDue,
    proposed_due: p.proposedDue,
    reason: p.reason,
    status: 'pending' as const,
  }))

  const { error } = await supabase
    .from('deadline_proposals')
    .upsert(rows, { onConflict: 'user_id,task_id' })

  if (error)
  {
    // Tabela pode não existir ainda — fallback local silencioso
    console.warn('[deadlineProposalApi] upsert:', error.message)
  }
}

export async function resolveDeadlineProposal(
  taskId: number,
  action: 'accepted' | 'rejected',
): Promise<void>
{
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('deadline_proposals')
    .update({
      status: action,
      resolved_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('status', 'pending')

  if (error)
  {
    console.warn('[deadlineProposalApi] resolve:', error.message)
  }
}

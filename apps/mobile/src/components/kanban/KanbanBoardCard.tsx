import { type MobileTask } from '@simply-life/shared'
import { KanbanTaskRow } from './KanbanTaskRow'

type Props = {
  task: MobileTask
  onToggle: () => void
  onLongPress?: () => void
}

export function KanbanBoardCard({ task, onToggle, onLongPress }: Props)
{
  return <KanbanTaskRow task={task} onToggle={onToggle} onLongPress={onLongPress} />
}

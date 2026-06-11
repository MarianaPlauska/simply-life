import type { TarefaUnificada } from '../types'

// Rascunho vazio para modo criação no drawer

export function createEmptyTaskDraft(): TarefaUnificada
{
  return {
    id: 0,
    user_id: '',
    titulo: '',
    descricao: null,
    snippet_100_char: '',
    score_urgencia: 0,
    status: 'pendente',
    prioridade: 'media',
    origem: 'manual',
    notas_locais: null,
    data_vencimento: null,
    created_at: null,
    versao: 1,
    subtarefas: [],
    labels: [],
    blockedBy: [],
    daysStagnant: 0,
    remetente: null,
    score_reason: null,
    urgency_reason: null,
    intent_category: null,
  }
}

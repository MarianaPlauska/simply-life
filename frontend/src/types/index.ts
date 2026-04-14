export interface TarefaUnificada {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  snippet_100_char: string;
  score_urgencia: number;
  status: 'pendente' | 'em_progresso' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  origem: string;
  notas_locais: string | null;
  data_vencimento: string | null;
  created_at: string | null;
}
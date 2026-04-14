export interface TarefaUnificada {
  id: number;
  usuario_id: number;
  titulo: string;
  snippet_100_char: string;
  score_urgencia: number;
  status: 'pendente' | 'hoje' | 'concluida';
  notas_locais: string | null;
}
export interface Label {
  id: number;
  nome: string;
  cor: string;
}

export interface Subtarefa {
  id: number;
  titulo: string;
  concluida: boolean;
  ordem: number;
}

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
  versao: number;
  subtarefas: Subtarefa[];
  labels: Label[];
}

// sprint D — recorrência, dependências, atividade
export interface RecorrenciaTarefa {
  id: number;
  tarefa_id: number;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  ativa: boolean;
  proximo_em: string | null;
  created_at: string | null;
}

export interface DependenciaTarefa {
  id: number;
  tarefa_id: number;
  depende_de_id: number;
  depende_de_titulo: string;
  depende_de_status: string;
}

export interface AtividadeTarefa {
  id: number;
  tipo: string;
  detalhe: string | null;
  created_at: string | null;
}

export interface TempoTarefa {
  total_minutos: number;
  sessoes: Array<{ id: number; duracao_minutos: number; created_at: string | null }>;
}

export interface HabitoStreak {
  habito_id: number;
  nome_exibicao: string;
  streak_dias: number;
  ultima_data: string | null;
}

// busca global (sprint 2)
export interface BuscaTarefaItem {
  id: number;
  titulo: string;
  status: string;
  prioridade: string;
  origem: string;
}

export interface BuscaAnotacaoItem {
  id: number;
  titulo: string | null;
  preview: string;
}

export interface BuscaResult {
  tarefas: BuscaTarefaItem[];
  anotacoes: BuscaAnotacaoItem[];
  total: number;
}
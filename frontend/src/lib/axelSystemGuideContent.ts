// Textos do guia — como o Simply-Life organiza tarefas e prioridades

export interface GuideSection
{
  id: string
  title: string
  body: string
  bullets?: string[]
}

export const AXEL_SYSTEM_GUIDE: GuideSection[] = [
  {
    id: 'kanban',
    title: 'Kanban e prazos',
    body: 'O quadro separa o que fazer primeiro do que vence quando. Tarefas com data entram em faixas: Atrasadas, Hoje, Esta semana, Sem data.',
    bullets: [
      'Toque no card para abrir detalhes; use ✓ para concluir.',
      'No celular, a aba Prazo lista por vencimento; Executar mostra a fila curta.',
      'Arrastar (desktop) ou botão ▶ move para Executar agora.',
    ],
  },
  {
    id: 'execucao',
    title: 'Executar agora vs Prazo',
    body: 'São visões diferentes da mesma tarefa — não se excluem.',
    bullets: [
      'Prazo: agrupa por data de vencimento (calendário).',
      'Executar agora: fila curta (máx. 8) do que fazer neste ciclo.',
      'Uma tarefa pode estar na fila e ainda vencer só na semana que vem.',
    ],
  },
  {
    id: 'score-visao',
    title: 'Prioridade (score)',
    body: 'Número de 0 a 100. Quanto maior, mais acima na fila e mais XP ao concluir. Aparece no card e na lista — não precisa decorar a fórmula.',
    bullets: [
      '80+ → crítica (vermelho) · 55–79 → alta · 30–54 → média · abaixo → baixa.',
      'O AXEL recalcula ao reorganizar o pipeline ou ao triar e-mails.',
      'Você pode fixar uma tarefa em Executar (ícone de pin no painel).',
    ],
  },
  {
    id: 'score-calculo',
    title: 'Como o score é calculado',
    body: 'O motor soma fatores e limita em 100. Tarefas criadas manualmente usam palavras-chave locais; e-mails e integrações passam pelo motor completo.',
    bullets: [
      'Origem: reunião/calendário (+50), GitHub (+30–35), e-mail (+15), manual (+10).',
      'Texto: “urgente”, “bloqueado”, “hotfix” elevam; newsletter/marketing reduzem.',
      'IA: flags VIP, bug ou urgente somam pontos extras nas triagens.',
      'Envelhecimento: +2 por dia parada (até +20) — evita esquecer demandas antigas.',
      'Prazo hoje ou score > 90 empurra para Executar; esta semana se score > 70 ou em progresso.',
      'Palavras-chave em Preferências → IA reforçam o que importa para você.',
    ],
  },
  {
    id: 'foco-xp',
    title: 'Foco, checklist e XP',
    body: 'Concluir com prova de trabalho (tempo no timer) mantém a ofensiva diária.',
    bullets: [
      '▶ Iniciar no card ou painel liga o temporizador de foco.',
      'Checklist 100% pode concluir automaticamente.',
      'Main Quest e score alto dão bônus de XP.',
    ],
  },
  {
    id: 'humor',
    title: 'Humor e carga do dia',
    body: 'O registro de humor no dashboard ajusta quantos pontos de score cabem na fila do dia — dias difíceis, fila menor.',
  },
  {
    id: 'notificacoes',
    title: 'Notificações',
    body: 'Finanças e saúde podem ser limpas. Alertas de prazo nas próximas 24h ficam no sino até você concluir a tarefa.',
  },
  {
    id: 'rascunho',
    title: 'Rascunhos e histórico',
    body: 'Nova demanda sem salvar vira rascunho ao fechar. Prazo é obrigatório: data ou «Sem prazo definido».',
    bullets: [
      'Enquanto cria, o log registra título, prazo, prioridade e checklist.',
      'Eventos rápidos: bloqueio, andamento e dependência (em português no painel).',
    ],
  },
]

export const SYSTEM_GUIDE_SEEN_KEY = 'simply-life:system-guide-seen'

export function hasSeenSystemGuide(): boolean
{
  try
  {
    return localStorage.getItem(SYSTEM_GUIDE_SEEN_KEY) === '1'
  }
  catch
  {
    return false
  }
}

export function markSystemGuideSeen(): void
{
  try
  {
    localStorage.setItem(SYSTEM_GUIDE_SEEN_KEY, '1')
  }
  catch { /* quota */ }
}

// Frases do AXEL — tom Wysa/Headspace (espelho de packages/shared/src/axelCare.ts)
// Rotação sincronizada via user_workspace_prefs.axel_care_rotation (Supabase)

import { pickRotatingFromPool } from './axelCareRotation'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export const MOOD_CARE_BY_LEVEL: Record<MoodLevel, string[]> = {
  1: [
    'Eu ouço você. Hoje pesa — e tudo bem pedir ajuda.',
    'Obrigado por confiar em mim. Vamos no seu ritmo, sem pressa.',
    'Dias difíceis existem. Você não precisa carregar tudo sozinho.',
    'Registrou — isso já é um gesto de cuidado com você.',
    'Estou aqui. Priorizo o essencial e protejo sua energia hoje.',
    'Parece um dia pesado. Não há pressa para resolver tudo agora.',
    'Obrigado por ser honesto comigo. Isso já ajuda muito.',
    'Seu sentimento é válido. Ajusto a carga para te acolher.',
    'Um passo de cada vez. Estou ao seu lado neste momento.',
  ],
  2: [
    'Percebi que o dia está pesado. Ajusto a carga com carinho.',
    'Obrigado por ser honesto. Pequenos passos também contam.',
    'Não precisa fingir que está bem. Eu cuido do que vier depois.',
    'Seu registro me ajuda a te acolher melhor — guardado só para você.',
    'Vamos suaviar o ritmo hoje. O importante é você se sentir apoiado.',
    'Dias assim acontecem. Vou priorizar o que realmente importa.',
    'Obrigado por parar um instante e se registrar.',
    'Estou contigo. Menos pressão, mais presença.',
    'Registro anotado — cuido para não te sobrecarregar.',
  ],
  3: [
    'Neutro também é válido. Obrigado por marcar como está.',
    'Registro anotado — sigo calibrando seu dia com equilíbrio.',
    'Um dia no meio do caminho. Estou acompanhando com você.',
    'Presença registrada. Ajusto prioridades sem te pressionar.',
    'Obrigado por o check-in. Continuo aqui, no seu lado.',
    'Tudo bem estar assim. O AXEL respeita seu ritmo.',
    'Check-in recebido. Equilíbrio é o foco de hoje.',
    'Obrigado por aparecer. Isso já faz diferença.',
    'Estou atento ao seu dia — sem cobrança.',
  ],
  4: [
    'Que bom sentir esse tom no seu dia. Aproveito para manter o fluxo.',
    'Obrigado por compartilhar — seu ritmo está em boa forma.',
    'Registro positivo! Vou equilibrar tarefas com esse ânimo.',
    'Fico feliz em saber. Cuido para não sobrecarregar mesmo nos bons dias.',
    'Seu humor ajuda o AXEL a te apoiar com mais precisão.',
    'Energia boa! Vamos usar isso com inteligência, não com pressa.',
    'Obrigado pelo check-in. Mantenho o dia fluindo bem.',
    'Que bom! Registro guardado com carinho.',
    'Percebi o tom positivo — ajusto o plano com leveza.',
  ],
  5: [
    'Energia ótima! Vamos canalizar isso com inteligência, não com pressa.',
    'Que dia bonito por dentro. Registro guardado com carinho.',
    'Obrigado por esse check-in — celebro com você, sem exagero.',
    'Seu brilho de hoje entra no seu perfil. Sigo ao seu lado.',
    'Maravilha. Ajusto o plano para acompanhar essa vibe.',
    'Que energia boa! Vamos fazer valer sem se esgotar.',
    'Obrigado por compartilhar — isso ilumina o meu mapa do seu dia.',
    'Dia forte por dentro. Cuido para manter o ritmo sustentável.',
    'Adorei saber. Registro feito — vamos com calma e foco.',
  ],
}

export const STREAK_CARE_MESSAGES: string[] = [
  'Dia salvo! Você cuidou de si — isso importa muito.',
  'Ofensiva mantida. Estou orgulhoso da sua constância gentil.',
  'Ritual feito. Seu futuro eu agradece esse gesto hoje.',
  'Você apareceu por si mesmo. Isso é ser cuidado de verdade.',
  'Mais um dia no caminho. Sigo aqui, no seu ritmo.',
  'Check-in completo — prioridades ajustadas com carinho.',
  'Pequena ação, grande cuidado. Ofensiva segura!',
  'Você não está só nessa jornada. Registro honrado.',
  'Constância sem culpa: esse é o nosso combinado. Parabéns.',
  'Dia protegido. Descanse sabendo que fez o essencial.',
]

export function pickMoodCareMessage(level: MoodLevel): string
{
  const pool = MOOD_CARE_BY_LEVEL[level] ?? MOOD_CARE_BY_LEVEL[3]
  return pickRotatingFromPool(pool, `mood-${level}`)
}

export function pickStreakCareMessage(): string
{
  return pickRotatingFromPool(STREAK_CARE_MESSAGES, 'streak')
}

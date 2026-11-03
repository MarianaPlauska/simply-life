import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, PrimaryButton } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'

const CONTATO = 'marianaplauska.c@gmail.com'
const ATUALIZADO = '2 de novembro de 2026'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: 'O que é o SunFy',
    itens: [
      'O SunFy é um app pessoal para organizar tarefas, saúde, bem-estar e dinheiro, com a ajuda do Axel, um assistente com inteligência artificial.',
      'Ao criar uma conta ou usar o app, você concorda com estes termos e com a Política de privacidade.',
    ],
  },
  {
    titulo: 'Sua conta',
    itens: [
      'Você é responsável pelo que registra e por manter sua senha em segurança. Uma conta é de uso pessoal.',
      'É preciso ter pelo menos 13 anos. Entre 13 e 18 anos, use com o conhecimento de um responsável.',
      'Você pode apagar a conta e todos os dados a qualquer momento, em Configurações ou pelo e-mail de contato.',
    ],
  },
  {
    titulo: 'O Axel e as sugestões',
    itens: [
      'As sugestões do Axel (plano do dia, estimativas, descobertas sobre seus hábitos, dicas de gasto) são geradas automaticamente e podem errar. Use como apoio, não como decisão final.',
      'As descobertas mostram padrões nos seus próprios registros. Um padrão não prova que uma coisa causa a outra.',
    ],
  },
  {
    titulo: 'Saúde e dinheiro',
    itens: [
      'O SunFy não é um serviço médico, psicológico ou nutricional e não faz diagnóstico. Não substitui psicoterapia, psiquiatria nem acompanhamento profissional.',
      'Em sofrimento intenso ou risco, procure o CVV (188, 24 horas), o SAMU (192) ou um pronto-socorro.',
      'O SunFy não é banco nem consultoria financeira. Os números de saldo e previsão dependem do que você registra.',
    ],
  },
  {
    titulo: 'Círculo e metas juntos',
    itens: [
      'Nos recursos com amigos, os outros veem só seu nome, avatar, Elo e o progresso em faixas das metas em comum. Nunca seus registros pessoais.',
      'Não use o app para assediar, enganar ou expor outras pessoas. Contas que fizerem isso podem ser suspensas.',
    ],
  },
  {
    titulo: 'Disponibilidade e mudanças',
    itens: [
      'O app pode ficar fora do ar por manutenção ou falhas. Fazemos o possível para não perder dados, mas recomendamos não guardar no app a única cópia de algo importante.',
      'Estes termos podem mudar. Quando a mudança for importante, avisamos no app antes de valer.',
      'Valem as leis do Brasil, incluindo o Código de Defesa do Consumidor e a LGPD.',
    ],
  },
  {
    titulo: 'Contato',
    itens: [`Dúvidas, pedidos ou reclamações: ${CONTATO}.`],
  },
]

/** Termos de uso: públicos (sem login), link exigido pela App Store e Play Store */
export default function TermosScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  return (
    <Screen scroll>
      <View style={{ gap: space.xl, paddingVertical: space.lg, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: space.xs }}>
          <Text variant="title">Termos de uso</Text>
          <Text variant="caption" muted>
            Atualizados em {ATUALIZADO}
          </Text>
        </View>
        {SECOES.map((s) => (
          <View key={s.titulo} style={{ gap: space.sm }}>
            <Text variant="section">{s.titulo}</Text>
            {s.itens.map((t) => (
              <Text key={t} variant="body" muted>
                {t}
              </Text>
            ))}
          </View>
        ))}
        <PrimaryButton label="Ler a Política de privacidade" variant="link" onPress={() => router.push('/privacidade')} />
      </View>
    </Screen>
  )
}

import { View } from 'react-native'
import { Screen, Text } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'

const CONTATO = 'marianaplauska.c@gmail.com'
const ATUALIZADO = '1 de novembro de 2026'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: 'Quem somos',
    itens: [
      `O SunFy é um app pessoal de rotina, saúde e finanças. Responsável pelos dados: Mariana Plauska. Contato: ${CONTATO}.`,
    ],
  },
  {
    titulo: 'O que coletamos',
    itens: [
      'Conta: e-mail, nome de exibição e foto, se você enviar. Login com Google usa só o seu e-mail e nome.',
      'O que você registra: tarefas, pastas, anotações, metas e hábitos.',
      'Saúde e bem-estar: humor, água, sono, remédios, treinos e alimentação. A câmera é usada só para ler o código de barras de alimentos; nenhuma foto é guardada.',
      'Finanças: gastos, contas fixas, salário e cartões (apelido e limite; nunca o número do cartão).',
      'Localização aproximada, só se você permitir, para mostrar o clima do dia. Não guardamos o histórico de onde você esteve.',
      'Integrações opcionais: Google Agenda (leitura dos eventos) e Gmail (leitura de e-mails que batem com as palavras-chave que você escolher). A senha de app do Gmail é guardada criptografada.',
      'Notificações: um identificador do aparelho para enviar lembretes.',
    ],
  },
  {
    titulo: 'Para que usamos',
    itens: [
      'Mostrar e sincronizar seus dados entre seus aparelhos.',
      'Gerar sugestões do Axel (plano do dia, estimativas, resumos). Para isso, o texto necessário é enviado a provedores de IA (Groq e Google Gemini), que não usam esses dados para treinar modelos.',
      'Enviar os lembretes que você ativou.',
      'Não vendemos seus dados e não usamos anúncios.',
    ],
  },
  {
    titulo: 'Onde ficam',
    itens: [
      'Banco de dados e login: Supabase. Servidor das funções: Vercel. Os dados trafegam com criptografia (HTTPS) e cada conta só acessa os próprios registros.',
      'Recursos sociais (amigos, metas em conjunto) mostram aos participantes só o que você escolheu compartilhar.',
    ],
  },
  {
    titulo: 'Seus direitos (LGPD)',
    itens: [
      `Você pode pedir acesso, correção, exportação ou exclusão da conta e de todos os dados pelo e-mail ${CONTATO}. Respondemos em até 15 dias.`,
      'Você pode desligar localização, câmera, notificações e integrações a qualquer momento nas configurações do aparelho ou do app.',
      'O SunFy não é destinado a menores de 13 anos.',
    ],
  },
  {
    titulo: 'Saúde',
    itens: [
      'O SunFy não é um serviço médico e não substitui acompanhamento profissional. Em crise, procure o CVV (188) ou o SAMU (192).',
    ],
  },
]

/** Política de privacidade: pública (sem login), link exigido pela Play Store */
export default function PrivacidadeScreen()
{
  const { space } = useTheme()
  return (
    <Screen scroll>
      <View style={{ gap: space.xl, paddingVertical: space.lg, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: space.xs }}>
          <Text variant="title">Política de privacidade</Text>
          <Text variant="caption" muted>
            Atualizada em {ATUALIZADO}
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
      </View>
    </Screen>
  )
}

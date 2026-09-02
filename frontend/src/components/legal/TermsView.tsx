import { Link } from 'react-router-dom'
import { AXEL_PAGE_SHELL, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function TermsView()
{
  return (
    <article className={`${AXEL_PAGE_SHELL} max-w-2xl mx-auto py-10 px-5`}>
      <h1 className={`text-2xl font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>Termos de uso</h1>
      <p className={`text-[13px] mb-8 ${AXEL_TEXT_SECONDARY}`}>Simply-Life OS · produto pessoal · atualizado em agosto de 2026</p>

      <div className={`space-y-5 text-[14px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        <p>
          Ao criar uma conta você concorda em usar o Simply-Life de forma pessoal.
          Não há SLA, garantia comercial nem suporte pago.
        </p>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Uso aceitável</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Não tente acessar dados de outras contas.</li>
          <li>Não abuse das APIs (há rate limit nas rotas sensíveis).</li>
          <li>O modo demo, quando disponível, é compartilhado e pode ser resetado a qualquer momento.</li>
        </ul>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>IA (AXEL)</h2>
        <p>
          A priorização tenta usar modelos via Groq no servidor (cota Hobby).
          Sem chave, após a cota ou em falha, o quadro usa regras locais e avisa —
          não finge que a IA rodou. Textos de tarefas podem ir ao provedor quando
          a IA está ativa. Não coloque segredos no título.
        </p>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Conta e dados</h2>
        <p>
          Você pode exportar um JSON e apagar a conta em Perfil. Apagar remove o
          cadastro Auth e os dados ligados (CASCADE).
        </p>
        <p>
          <Link to="/privacidade" className="text-accent hover:underline">Política de privacidade</Link>
          {' · '}
          <Link to="/login" className="text-accent hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </article>
  )
}

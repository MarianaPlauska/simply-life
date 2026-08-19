import { Link } from 'react-router-dom'
import { AXEL_PAGE_SHELL, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../constants/axelSurfaces'

export function PrivacyView()
{
  return (
    <article className={`${AXEL_PAGE_SHELL} max-w-2xl mx-auto py-10 px-5`}>
      <h1 className={`text-2xl font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>Política de Privacidade</h1>
      <p className={`text-[13px] mb-8 ${AXEL_TEXT_SECONDARY}`}>Simply-Life OS · projeto pessoal / portfólio · atualizado em agosto de 2026</p>

      <div className={`space-y-5 text-[14px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        <p>
          O Simply-Life é um sistema operacional pessoal. Não vendemos dados, não fazemos anúncio
          comportamental e não integramos Open Finance / bancos.
        </p>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>O que coletamos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Conta: e-mail e nome (Supabase Auth).</li>
          <li>Tarefas, anotações e decisões do AXEL que você cria.</li>
          <li>Finanças que você registra (transações, orçamento 50/30/20, cartões).</li>
          <li>Saúde que você registra (humor, hábitos, treinos, medicamentos).</li>
          <li>Opcional: senha de app IMAP (criptografada no servidor) e inscrição de push.</li>
        </ul>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Como protegemos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Row Level Security no Postgres (`user_id = auth.uid()`).</li>
          <li>Chaves de IA e service role só no servidor Vercel.</li>
          <li>Credenciais de e-mail em AES-256-GCM quando a frente de IMAP está ativa.</li>
          <li>2FA TOTP opcional (Google Authenticator / Authy) via Supabase Auth.</li>
        </ul>
        <h2 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Seus direitos</h2>
        <p>
          Você pode exportar ou apagar seus dados pela conta, ou pedir exclusão pelo e-mail
          associado ao cadastro. Este é um projeto de portfólio, não um produto comercial.
        </p>
        <p>
          <Link to="/termos" className="text-accent hover:underline">Termos de uso</Link>
          {' · '}
          <Link to="/login" className="text-accent hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </article>
  )
}

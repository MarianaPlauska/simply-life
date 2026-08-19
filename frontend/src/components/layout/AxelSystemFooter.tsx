import { Link } from 'react-router-dom'
import { AXEL_CHROME_PLANE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface AxelSystemFooterProps
{
  className?: string
}

export function AxelSystemFooter({ className = '' }: AxelSystemFooterProps)
{
  return (
    <footer
      className={`w-full mt-auto border-t border-line py-3 px-6 ${AXEL_CHROME_PLANE} ${className}`}
      aria-label="Status do sistema"
    >
      <p className={`font-mono text-[10px] uppercase tracking-[0.1em] text-center ${AXEL_TEXT_SECONDARY}`}>
        Simply-Life · Uma vida simplificada, com AXEL ao seu lado
      </p>
      <p className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-wide text-ink-muted">
        <Link to="/privacidade" className="hover:text-accent">Privacidade</Link>
        <span className="mx-2 opacity-40">·</span>
        <Link to="/termos" className="hover:text-accent">Termos</Link>
      </p>
    </footer>
  )
}

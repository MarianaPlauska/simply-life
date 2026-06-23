import { AXEL_CHROME_PLANE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Rodapé de sistema — sticky footer via mt-auto no pai flex-col min-h-screen

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
    </footer>
  )
}

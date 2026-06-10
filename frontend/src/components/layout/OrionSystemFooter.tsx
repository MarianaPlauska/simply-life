import { ORION_CHROME_PLANE, ORION_TEXT_SECONDARY } from '../../constants/orionSurfaces'

// Rodapé de sistema — sticky footer via mt-auto no pai flex-col min-h-screen

interface OrionSystemFooterProps
{
  className?: string
}

export function OrionSystemFooter({ className = '' }: OrionSystemFooterProps)
{
  return (
    <footer
      className={`w-full mt-auto border-t border-line py-3 px-6 ${ORION_CHROME_PLANE} ${className}`}
      aria-label="Status do sistema"
    >
      <p className={`font-mono text-[10px] uppercase tracking-[0.12em] text-left ${ORION_TEXT_SECONDARY}`}>
        Simply-Life OS · v1.0 · sincronizado
      </p>
    </footer>
  )
}

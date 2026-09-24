import { type ReactNode } from 'react'
import { HealthScreenSection } from '../HealthScreenSection'

/** Alias do diário — mesma seção integrada da aba Saúde. */
export function DiarySection({
  children,
  title,
  dividerTop = false,
}: {
  children: ReactNode
  title?: string
  dividerTop?: boolean
})
{
  return (
    <HealthScreenSection title={title} dividerTop={dividerTop}>
      {children}
    </HealthScreenSection>
  )
}

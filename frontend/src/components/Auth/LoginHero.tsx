import { SimplyLifeMark, SunFyWordmark } from '../brand/SimplyLifeMark'
import { LoginProductMock } from './LoginProductMock'
import { useTranslation } from 'react-i18next'

/** Lado esquerdo do login no desktop: claro, Petróleo e Coral, sem bloco escuro. */
export function LoginHero()
{
  const { t } = useTranslation()

  return (
    <div
      className="hidden lg:flex relative overflow-hidden rounded-[28px] h-full min-h-[720px] flex-col px-8 xl:px-12 pt-10 pb-8 border"
      style={{ background: 'var(--lg-surface)', borderColor: 'var(--lg-line)' }}
    >
      {/* luz suave: menta no alto, coral perto dos aparelhos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 12% 8%, var(--lg-glow-menta) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 70% 78%, var(--lg-glow-coral) 0%, transparent 72%)',
        }}
      />
      <div className="relative z-10 shrink-0">
        <div className="flex items-center gap-2.5 mb-6">
          <SimplyLifeMark variant="icon" className="w-10 h-10" />
          <div className="flex flex-col leading-tight">
            <SunFyWordmark className="font-display text-[19px] font-semibold tracking-tight text-[color:var(--lg-ink)]" />
            <span className="font-sans text-[12px]" style={{ color: 'var(--lg-muted)' }}>
              {t('login.hero_badge')}
            </span>
          </div>
        </div>
        <h1
          className="text-[44px] xl:text-[52px] font-display leading-[1.04] tracking-tight"
          style={{ color: 'var(--lg-brand-ink)' }}
        >
          {t('login.hero_title').split('\n').map((line, i, all) => (
            <span
              key={line}
              className="block"
              style={i === all.length - 1 ? { color: 'var(--lg-coral-text)' } : undefined}
            >
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-[24px] whitespace-pre-line" style={{ color: 'var(--lg-muted)' }}>
          {t('login.hero_subtitle')}
        </p>
      </div>
      <div className="relative z-10 flex-1 mt-6 min-h-[440px]">
        <LoginProductMock />
      </div>
    </div>
  )
}

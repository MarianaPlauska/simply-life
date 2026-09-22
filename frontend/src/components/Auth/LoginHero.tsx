import { SimplyLifeMark } from '../brand/SimplyLifeMark'
import { LoginProductMock } from './LoginProductMock'
import { useTranslation } from 'react-i18next'

export function LoginHero()
{
  const { t } = useTranslation()

  return (
    <div className="hidden lg:flex relative overflow-hidden rounded-[28px] h-full min-h-[720px] flex-col px-8 xl:px-12 pt-10 pb-6 bg-[#050403] text-[#F7F3EE]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 48% at 58% 72%, rgba(232,115,74,0.46) 0%, rgba(232,115,74,0.12) 44%, transparent 72%)',
        }}
      />
      <div className="relative z-10 shrink-0">
        <div className="flex items-center gap-2.5 mb-5">
          <SimplyLifeMark variant="icon" className="w-10 h-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-sans text-[15px] font-semibold tracking-tight text-[#F7F3EE]">Simply-Life</span>
            <span className="font-sans text-[11px] text-white/55">OS pessoal</span>
          </div>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-full border border-accent/45 bg-accent/15 px-3 text-[11px] font-semibold tracking-wide">
          {t('login.hero_badge')}
        </span>
        <h1 className="mt-4 text-[40px] xl:text-[48px] font-display leading-[1.05] tracking-tight">
          {t('login.hero_title').split('\n').map((line, i, all) => (
            <span
              key={line}
              className={`block ${i === all.length - 1 ? 'text-accent' : ''}`}
            >
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75 whitespace-pre-line">
          {t('login.hero_subtitle')}
        </p>
      </div>
      <div className="relative z-10 flex-1 mt-2 min-h-[440px]">
        <LoginProductMock />
      </div>
    </div>
  )
}

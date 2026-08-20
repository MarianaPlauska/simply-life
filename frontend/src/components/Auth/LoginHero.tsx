import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { SimplyLifeMark } from '../brand/SimplyLifeMark'

const FEATURE_KEYS = [
  'login.hero_feature_1',
  'login.hero_feature_2',
  'login.hero_feature_3',
] as const

export function LoginHero()
{
  const { t } = useTranslation()

  return (
    <div className="hidden lg:flex flex-col justify-center px-12 xl:px-16 py-12 max-w-lg">
      <SimplyLifeMark variant="lockup" className="mb-6" />
      <h1 className="text-[36px] xl:text-[42px] font-display text-ink leading-[1.1] tracking-tight">
        {t('login.hero_title')}
      </h1>
      <p className="text-[15px] text-ink-muted mt-4 leading-relaxed">
        {t('login.hero_subtitle')}
      </p>

      <ul className="mt-10 space-y-3">
        {FEATURE_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-3 text-[13px] text-ink-muted">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

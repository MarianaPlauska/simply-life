import { useEffect, useState } from 'react'
import { User, Mail, Camera, Bell, Moon, Keyboard, Monitor, Save, LogOut, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { supabase } from '../../lib/supabase'
import { fetchIsAdmin } from '../../lib/adminUsers'
import { OperadorOfensivaCard } from '../dashboard/OperadorOfensivaCard'
import { ProfileAxelHero } from '../gamification/ProfileAxelHero'
import { AxelTrailPanel } from '../gamification/AxelTrailPanel'
import { WeeklyEpisodeCard } from '../gamification/WeeklyEpisodeCard'
import { MonthlyStreakShieldCard } from '../gamification/MonthlyStreakShieldCard'
import { ProfileAchievementsGrid } from '../gamification/ProfileAchievementsGrid'
import { AxelRewardShop } from '../gamification/AxelRewardShop'
import { AxelCosmeticsLibrary } from '../gamification/AxelCosmeticsLibrary'
import { InviteFriendPanel } from '../social/InviteFriendPanel'
import { FriendCircleCard } from '../social/FriendCircleCard'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { ProfileAdminUsersPanel } from './ProfileAdminUsersPanel'
import { ProfileWorkspacePrefsPanel } from './ProfileWorkspacePrefsPanel'
import { MfaEnrollPanel } from './MfaEnrollPanel'
import {
  AXEL_BTN_PRIMARY,
  AXEL_BORDERLESS_PANEL,
  AXEL_PAGE_SHELL_MOBILE_NARROW,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

export function ProfileView()
{
  const userProfile = useTaskStore((s) => s.userProfile)
  const updateProfile = useTaskStore((s) => s.updateProfile)
  const logout = useTaskStore((s) => s.logout)
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)
  const streakCount = useTaskStore((s) => s.streakCount)
  const userStats = useTaskStore((s) => s.userStats)

  const [nome, setNome] = useState(userProfile.nome)
  const [email, setEmail] = useState(userProfile.email)
  const [saved, setSaved] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() =>
  {
    syncStreakCalendarDay()
    void fetchAchievements?.()
    void fetchGamificacaoStats?.()
  }, [syncStreakCalendarDay, fetchAchievements, fetchGamificacaoStats])

  useEffect(() =>
  {
    let ativo = true

    const refreshAdmin = () =>
    {
      void fetchIsAdmin().then((admin) =>
      {
        if (ativo) setIsAdmin(admin)
      })
    }

    refreshAdmin()

    const { data: authSub } = supabase.auth.onAuthStateChange(() =>
    {
      refreshAdmin()
    })

    const onFocus = () => { refreshAdmin() }
    window.addEventListener('focus', onFocus)

    return () =>
    {
      ativo = false
      authSub.subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const handleSave = () =>
  {
    updateProfile({ nome, email })
    setSaved(true)
    toast.success('Perfil atualizado')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`${AXEL_PAGE_SHELL_MOBILE_NARROW} px-3 sm:px-4 lg:px-6 xl:px-8 pb-16 space-y-3 sm:space-y-4`}>
      <header>
        <p className="sl-eyebrow">Identidade</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <h1 className={`text-2xl font-display ${AXEL_TEXT_PRIMARY}`}>
            Meu perfil
          </h1>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sl bg-accent/15 text-accent text-[10px] font-mono uppercase">
              <ShieldCheck className="w-3 h-3" aria-hidden />
              Admin
            </span>
          )}
        </div>
        <p className={`text-[13px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
          Toque em cada bloco para ver detalhes
        </p>
      </header>

      {isAdmin && (
        <>
          <DashboardCollapsible title="Usuários" subtitle="Administração do sistema" defaultOpen>
            <ProfileAdminUsersPanel />
          </DashboardCollapsible>

          <DashboardCollapsible title="Segurança admin" subtitle="Autenticação em dois fatores (TOTP)">
            <MfaEnrollPanel />
          </DashboardCollapsible>
        </>
      )}

      <ProfileAxelHero />

      <DashboardCollapsible
        title="Trilha AXEL"
        subtitle="Níveis, XP e o que você desbloqueia"
        defaultOpen
      >
        <AxelTrailPanel />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Meu AXEL"
        subtitle="Avatar, mascote e o que aparece no dashboard"
        defaultOpen
      >
        <ProfileWorkspacePrefsPanel />
      </DashboardCollapsible>

      <DashboardCollapsible title="Social" subtitle="Círculo de amigos e convites">
        <FriendCircleCard />
        <InviteFriendPanel />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Episódio da semana"
        subtitle="Resumo dos últimos 7 dias"
      >
        <WeeklyEpisodeCard />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Escudos de ofensiva"
        subtitle={`${streakCount} dia(s) de sequência`}
      >
        <MonthlyStreakShieldCard />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Momentum AXEL"
        subtitle={`Nv ${userStats?.level ?? 1} · ofensiva e foco`}
      >
        <OperadorOfensivaCard />
      </DashboardCollapsible>

      <DashboardCollapsible title="Conquistas" subtitle="Badges e missões">
        <ProfileAchievementsGrid />
      </DashboardCollapsible>

      <DashboardCollapsible title="Coleção AXEL" subtitle="Cores, molduras e cosméticos">
        <AxelCosmeticsLibrary />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Loja AXEL"
        subtitle="Resgatar escudos e cosméticos"
      >
        <AxelRewardShop />
      </DashboardCollapsible>

      <DashboardCollapsible title="Conta" subtitle={userProfile.email || 'Dados pessoais'}>
        <section className={`${AXEL_BORDERLESS_PANEL} border-0 p-0`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-sl bg-chrome border border-line flex items-center justify-center">
                <User className="w-7 h-7 text-ink-muted" aria-hidden />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-sl bg-card border border-line text-ink-muted hover:text-ink transition-colors"
                aria-label="Alterar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-display ${AXEL_TEXT_PRIMARY}`}>
                {userProfile.nome || 'Convidado'}
              </h2>
              <p className={`text-[12px] truncate ${AXEL_TEXT_SECONDARY}`}>
                {userProfile.email || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-nome" className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  id="profile-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-chrome border border-line rounded-sl pl-10 pr-4 py-2.5 text-[13px] text-ink outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-email" className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-chrome border border-line rounded-sl pl-10 pr-4 py-2.5 text-[13px] text-ink outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Salvo' : 'Salvar alterações'}
          </button>
        </section>
      </DashboardCollapsible>

      <DashboardCollapsible title="Preferências rápidas" subtitle="Notificações e acessibilidade">
        <div className="divide-y divide-line">
          <PreferenceRow icon={Bell} label="Notificações" description="Tarefas e lembretes" />
          <PreferenceRow icon={Moon} label="Tema escuro" description="Instrumento AXEL ativo" defaultOn />
          <PreferenceRow icon={Keyboard} label="Atalhos" description="⌘K abre criar ou buscar" defaultOn />
          <PreferenceRow icon={Monitor} label="Movimento reduzido" description="Acessibilidade" />
        </div>
      </DashboardCollapsible>

      <section className="rounded-sl border border-urgente/30 bg-urgente/5 p-4">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-urgente border border-urgente/40 rounded-sl hover:bg-urgente/10 transition-colors"
        >
          <LogOut size={14} />
          Sair da conta
        </button>
      </section>
    </div>
  )
}

function PreferenceRow({
  icon: Icon,
  label,
  description,
  defaultOn = false,
}: {
  icon: React.ElementType
  label: string
  description: string
  defaultOn?: boolean
})
{
  const [enabled, setEnabled] = useState(defaultOn)

  return (
    <div className="flex items-center justify-between py-3.5 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-ink-muted shrink-0" />
        <div>
          <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>{label}</p>
          <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}: ${enabled ? 'ativado' : 'desativado'}`}
        onClick={() => setEnabled((v) => !v)}
        className={`relative w-9 h-5 rounded-sl shrink-0 transition-colors ${enabled ? 'bg-accent' : 'bg-chrome border border-line'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-sl bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Flame, Shield, ChevronDown,
  Settings, User, LogOut, Moon,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import {
  ORION_BORDERLESS_PANEL,
  ORION_DROPDOWN,
  ORION_LINE,
  ORION_PROGRESS,
  ORION_PROGRESS_THICK,
  ORION_SECTION_TITLE,
  ORION_AVATAR,
  ORION_AVATAR_INITIALS,
  ORION_TOUCH_ROW,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'

// Status do operador — painel lateral do dashboard

interface AtributoChip
{
  key: 'foco' | 'vitalidade' | 'estabilidade'
  label: string
  Icon: typeof Zap
  iconClass: string
}

const ATRIBUTOS: AtributoChip[] = [
  { key: 'foco',         label: 'Foco',         Icon: Zap,    iconClass: 'text-accent' },
  { key: 'vitalidade',   label: 'Vitalidade',   Icon: Flame,  iconClass: 'text-atencao' },
  { key: 'estabilidade', label: 'Estabilidade', Icon: Shield, iconClass: 'text-ink-muted' },
]

interface UserStatusProps
{
  embedded?: boolean
}

function iniciaisDe(nome: string): string
{
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2)
  {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  if (partes.length === 1 && partes[0].length >= 2)
  {
    return partes[0].slice(0, 2).toUpperCase()
  }
  return 'MC'
}

function arquetipo(level: number): string
{
  if (level >= 20) return 'Mestre'
  if (level >= 10) return 'Veterano'
  if (level >= 5) return 'Operador'
  return 'Recruta'
}

export function UserStatus({ embedded: _embedded = false }: UserStatusProps)
{
  const userProfile = useTaskStore((s) => s.userProfile)
  const userStats = useTaskStore((s) => s.userStats)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements)
  const fetchQuests = useTaskStore((s) => s.fetchQuests)
  const logout = useTaskStore((s) => s.logout)

  useEffect(() =>
  {
    fetchGamificacaoStats?.()
    fetchAchievements?.()
    fetchQuests?.()
  }, [fetchGamificacaoStats, fetchAchievements, fetchQuests])

  const nome = userProfile?.nome || 'Convidado'
  const iniciais = iniciaisDe(nome)
  const firstName = nome.split(' ')[0]

  const profile = computeGamificationProfile(userStats)
  const levelGlobal = profile.level
  const xpNoNivel = profile.xpInLevel
  const xpPct = profile.xpPct

  const attrLevels = {
    foco:         Math.floor((userStats?.xp_foco ?? 0) / 100) + 1,
    vitalidade:   Math.floor((userStats?.xp_vitalidade ?? 0) / 100) + 1,
    estabilidade: Math.floor((userStats?.xp_estabilidade ?? 0) / 100) + 1,
  }

  return (
    <section
      aria-labelledby="user-status-heading"
      className={`${ORION_BORDERLESS_PANEL} flex flex-col`}
    >
      <h2 id="user-status-heading" className={`${ORION_SECTION_TITLE} mb-4`}>
        Operador
      </h2>

      <ProfileHeader
        nome={nome}
        firstName={firstName}
        email={userProfile?.email}
        iniciais={iniciais}
        level={levelGlobal}
        onLogout={logout}
      />

      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className={`font-mono text-[10px] uppercase tracking-wider ${ORION_TEXT_SECONDARY}`}>
            Nível {levelGlobal} · {arquetipo(levelGlobal)}
          </span>
          <span className={`font-mono text-[10px] tabular-nums ${ORION_TEXT_SECONDARY}`}>
            {xpNoNivel}/{profile.xpToNextLevel} XP
          </span>
        </div>
        <div className={ORION_PROGRESS_THICK}>
          <div
            className={`h-full rounded-sl transition-all duration-500 ease-out ${ORION_PROGRESS}`}
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-2">
        {ATRIBUTOS.map((a) =>
        {
          const Icon = a.Icon
          return (
            <div key={a.key} className="flex flex-col items-center gap-1 py-2">
              <Icon className={`w-4 h-4 ${a.iconClass}`} strokeWidth={1.75} />
              <span className={`text-lg font-display tabular-nums ${ORION_TEXT_PRIMARY}`}>
                {attrLevels[a.key]}
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-wider ${ORION_TEXT_SECONDARY}`}>
                {a.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface ProfileHeaderProps
{
  nome: string
  firstName: string
  email?: string
  iniciais: string
  level: number
  onLogout?: () => void
}

function ProfileHeader({ nome, firstName, email, iniciais, level, onLogout }: ProfileHeaderProps)
{
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    if (!open) return
    const onClick = (e: MouseEvent) =>
    {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex flex-row items-center gap-3 text-left w-full rounded-sl hover:bg-chrome transition-colors ${ORION_TOUCH_ROW}`}
      >
        <div className={ORION_AVATAR} aria-hidden="true">
          <span className={ORION_AVATAR_INITIALS}>{iniciais}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[15px] font-display truncate ${ORION_TEXT_PRIMARY}`}>
              {firstName}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 ${ORION_TEXT_SECONDARY} transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
          <p className={`font-mono text-[10px] mt-0.5 ${ORION_TEXT_SECONDARY}`}>
            Lv {level}
          </p>
        </div>
      </button>

      {open && (
        <div className={`absolute z-50 left-0 right-0 top-full mt-2 py-1 ${ORION_DROPDOWN}`}>
          <div className="px-4 py-2 text-left">
            <div className={`text-[13px] font-medium truncate ${ORION_TEXT_PRIMARY}`}>{nome}</div>
            {email && <div className={`font-mono text-[10px] truncate mt-0.5 ${ORION_TEXT_SECONDARY}`}>{email}</div>}
          </div>
          <div className={ORION_LINE} />
          <MenuItem Icon={User} label="Meu perfil" onClick={() => { setOpen(false); navigate('/perfil') }} />
          <MenuItem Icon={Settings} label="Configurações" onClick={() => { setOpen(false); navigate('/configuracoes') }} />
          <MenuItem Icon={Moon} label="Preferências IA" onClick={() => { setOpen(false); navigate('/preferencias') }} />
          <div className={ORION_LINE} />
          <MenuItem Icon={LogOut} label="Sair" destructive onClick={() => { setOpen(false); onLogout?.() }} />
        </div>
      )}
    </div>
  )
}

interface MenuItemProps
{
  Icon: typeof User
  label: string
  onClick: () => void
  destructive?: boolean
}

function MenuItem({ Icon, label, onClick, destructive }: MenuItemProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 ${ORION_TOUCH_ROW} text-[13px] transition-colors text-left ${
        destructive
          ? 'text-urgente hover:bg-chrome'
          : `${ORION_TEXT_SECONDARY} hover:text-ink hover:bg-chrome`
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      {label}
    </button>
  )
}

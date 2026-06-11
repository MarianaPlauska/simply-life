import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Settings, User, LogOut, Moon,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_DROPDOWN,
  AXEL_LINE,
  AXEL_SECTION_TITLE,
  AXEL_AVATAR,
  AXEL_AVATAR_INITIALS,
  AXEL_TOUCH_ROW,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Chip de perfil — sem XP/ofensiva (isso fica em /perfil)

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

export function UserStatus({ embedded: _embedded = false }: UserStatusProps)
{
  const userProfile = useTaskStore((s) => s.userProfile)
  const userStats = useTaskStore((s) => s.userStats)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const logout = useTaskStore((s) => s.logout)

  useEffect(() =>
  {
    fetchGamificacaoStats?.()
  }, [fetchGamificacaoStats])

  const nome = userProfile?.nome || 'Convidado'
  const iniciais = iniciaisDe(nome)
  const firstName = nome.split(' ')[0]
  const level = computeGamificationProfile(userStats).level

  return (
    <section
      aria-labelledby="user-status-heading"
      className={`${AXEL_BORDERLESS_PANEL} flex flex-col`}
    >
      <h2 id="user-status-heading" className={`${AXEL_SECTION_TITLE} mb-4`}>
        Conta
      </h2>

      <ProfileHeader
        nome={nome}
        firstName={firstName}
        email={userProfile?.email}
        iniciais={iniciais}
        level={level}
        onLogout={logout}
      />
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
        className={`flex flex-row items-center gap-3 text-left w-full rounded-sl hover:bg-chrome transition-colors ${AXEL_TOUCH_ROW}`}
      >
        <div className={AXEL_AVATAR} aria-hidden="true">
          <span className={AXEL_AVATAR_INITIALS}>{iniciais}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[15px] font-display truncate ${AXEL_TEXT_PRIMARY}`}>
              {firstName}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 ${AXEL_TEXT_SECONDARY} transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
          <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Lv {level} · ver ofensiva no perfil
          </p>
        </div>
      </button>

      {open && (
        <div className={`absolute z-50 left-0 right-0 top-full mt-2 py-1 ${AXEL_DROPDOWN}`}>
          <div className="px-4 py-2 text-left">
            <div className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{nome}</div>
            {email && <div className={`font-mono text-[10px] truncate mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{email}</div>}
          </div>
          <div className={AXEL_LINE} />
          <MenuItem Icon={User} label="Perfil & ofensiva" onClick={() => { setOpen(false); navigate('/perfil') }} />
          <MenuItem Icon={Settings} label="Configurações" onClick={() => { setOpen(false); navigate('/configuracoes') }} />
          <MenuItem Icon={Moon} label="Preferências IA" onClick={() => { setOpen(false); navigate('/preferencias') }} />
          <div className={AXEL_LINE} />
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
      className={`w-full flex items-center gap-2.5 px-4 ${AXEL_TOUCH_ROW} text-[13px] transition-colors text-left ${
        destructive
          ? 'text-urgente hover:bg-chrome'
          : `${AXEL_TEXT_SECONDARY} hover:text-ink hover:bg-chrome`
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      {label}
    </button>
  )
}

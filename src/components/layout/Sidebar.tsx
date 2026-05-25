"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrophyIcon, LayoutDashboardIcon, UsersIcon, CalendarIcon,
  StarIcon, BarChart3Icon, ShieldIcon, XIcon, SettingsIcon, InboxIcon,
  LogOutIcon, UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from './UserAvatar'
import type { Profile } from '@/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const poolNavItems = (poolId: string): NavItem[] => [
  { label: 'Leaderboard',   href: `/pools/${poolId}/leaderboard`,  icon: BarChart3Icon },
  { label: 'Predicciones',  href: `/pools/${poolId}/predictions`,  icon: CalendarIcon },
  { label: 'Grupos',        href: `/pools/${poolId}/groups`,       icon: UsersIcon },
  { label: 'Bracket',       href: `/pools/${poolId}/bracket`,      icon: TrophyIcon },
  { label: 'Bonus',         href: `/pools/${poolId}/bonus`,        icon: StarIcon },
  { label: 'Reglas',        href: `/pools/${poolId}/rules`,        icon: ShieldIcon },
  { label: 'Configuración', href: `/pools/${poolId}/settings`,     icon: SettingsIcon },
]

const mainNavItems: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Mis Quinielas', href: '/pools',     icon: TrophyIcon },
  { label: 'Perfil',        href: '/profile',   icon: UserIcon },
]

interface SidebarContentProps {
  profile: Profile
  currentPoolId?: string
  onLogout: () => void
  onClose?: () => void
}

export function SidebarContent({ profile, currentPoolId, onLogout, onClose }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <TrophyIcon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Quiniela Mundial</p>
          <p className="text-xs text-muted-foreground">2026</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0">
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          {mainNavItems.map(item => (
            <SidebarLink key={item.href} item={item} pathname={pathname} onClick={onClose} />
          ))}
        </nav>

        {currentPoolId && (
          <>
            <Separator className="my-3" />
            <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Esta quiniela
            </p>
            <nav className="space-y-0.5">
              {poolNavItems(currentPoolId).map(item => (
                <SidebarLink key={item.href} item={item} pathname={pathname} onClick={onClose} />
              ))}
            </nav>
          </>
        )}

        {profile.role === 'super_admin' && (
          <>
            <Separator className="my-3" />
            <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
            <nav className="space-y-0.5">
              <SidebarLink
                item={{ label: 'Panel Admin', href: '/admin', icon: ShieldIcon }}
                pathname={pathname}
                onClick={onClose}
              />
              <SidebarLink
                item={{ label: 'Solicitudes', href: '/admin/access-requests', icon: InboxIcon }}
                pathname={pathname}
                onClick={onClose}
              />
            </nav>
          </>
        )}
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserAvatar profile={profile} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.nickname ?? profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onLogout} title="Cerrar sesión">
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function SidebarLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

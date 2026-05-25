"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon, TrophyIcon, UserIcon, ShieldIcon,
  BarChart3Icon, CalendarIcon, UsersIcon, HomeIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface BottomNavProps {
  profile: Profile
  currentPoolId?: string
}

export function BottomNav({ profile, currentPoolId }: BottomNavProps) {
  const pathname = usePathname()

  if (currentPoolId) {
    return <PoolBottomNav poolId={currentPoolId} pathname={pathname} />
  }
  return <MainBottomNav profile={profile} pathname={pathname} />
}

/* ─── Shared tab item ───────────────────────────────────────────────────────── */
function TabItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      /* 44 px minimum touch target (Apple HIG / WCAG 2.5.5) */
      className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] py-2 transition-colors"
    >
      {/* Pill indicator wraps the icon — Material 3 Navigation Bar pattern */}
      <span
        className={cn(
          "flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200",
          isActive
            ? "bg-primary/12 dark:bg-primary/20"
            : "bg-transparent"
        )}
      >
        <Icon
          className={cn(
            "size-6 transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          strokeWidth={isActive ? 2.25 : 1.75}
        />
      </span>
      <span
        className={cn(
          "text-[11px] leading-none font-medium transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

/* ─── Main nav (outside pool) ───────────────────────────────────────────────── */
function MainBottomNav({ profile, pathname }: { profile: Profile; pathname: string }) {
  const items = [
    { href: '/dashboard', icon: LayoutDashboardIcon, label: 'Inicio' },
    { href: '/pools',     icon: TrophyIcon,           label: 'Quinielas' },
    { href: '/profile',   icon: UserIcon,             label: 'Perfil' },
    ...(profile.role === 'super_admin'
      ? [{ href: '/admin', icon: ShieldIcon, label: 'Admin' }]
      : []),
  ]

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {items.map((item) => (
          <TabItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </div>
    </nav>
  )
}

/* ─── Pool nav (inside pool) ────────────────────────────────────────────────── */
function PoolBottomNav({ poolId, pathname }: { poolId: string; pathname: string }) {
  const items = [
    { href: `/pools/${poolId}/leaderboard`, icon: BarChart3Icon, label: 'Tabla',    exact: false },
    { href: `/pools/${poolId}/predictions`, icon: CalendarIcon,  label: 'Picks',    exact: false },
    { href: '/pools',                       icon: HomeIcon,       label: 'Inicio',   exact: true  },
    { href: `/pools/${poolId}/groups`,      icon: UsersIcon,      label: 'Grupos',   exact: false },
    { href: `/pools/${poolId}/bracket`,     icon: TrophyIcon,     label: 'Bracket',  exact: false },
  ]

  return (
    <nav
      aria-label="Navegación de quiniela"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {items.map((item) => (
          <TabItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </nav>
  )
}

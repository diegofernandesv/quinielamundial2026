"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon, TrophyIcon, UserIcon, ShieldIcon,
  BarChart3Icon, CalendarIcon, UsersIcon, HomeIcon, WalletIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface BottomNavProps {
  profile: Profile
  currentPoolId?: string
  pendingRequests?: number
}

export function BottomNav({ profile, currentPoolId, pendingRequests = 0 }: BottomNavProps) {
  const pathname = usePathname()

  if (currentPoolId) {
    return <PoolBottomNav poolId={currentPoolId} pathname={pathname} />
  }
  return <MainBottomNav profile={profile} pathname={pathname} pendingRequests={pendingRequests} />
}

/* ─── Shared tab item ───────────────────────────────────────────────────────── */
function TabItem({
  href,
  icon: Icon,
  label,
  isActive,
  badge = 0,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-transform duration-200 active:scale-[0.98]"
    >
      <span className="relative">
        <span
          className={cn(
            "flex h-10 w-14 items-center justify-center rounded-2xl border transition-all duration-200",
            isActive
              ? "border-primary/15 bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-primary/10 dark:bg-primary/20"
              : "border-transparent bg-transparent group-hover:bg-muted/60"
          )}
        >
          <Icon
            className={cn(
              "size-[1.35rem] transition-colors duration-200",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            strokeWidth={isActive ? 2.25 : 1.75}
          />
        </span>
        {badge > 0 && (
          <span className="absolute -top-0.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          "max-w-full truncate text-[10px] leading-none font-medium tracking-[0.01em] transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

/* ─── Main nav (outside pool) ───────────────────────────────────────────────── */
function MainBottomNav({ profile, pathname, pendingRequests }: { profile: Profile; pathname: string; pendingRequests: number }) {
  const items = [
    { href: '/dashboard', icon: LayoutDashboardIcon, label: 'Inicio',    badge: 0 },
    { href: '/pools',     icon: TrophyIcon,           label: 'Quinielas', badge: 0 },
    { href: '/profile',   icon: UserIcon,             label: 'Perfil',    badge: 0 },
    ...(profile.role === 'super_admin'
      ? [{ href: '/admin', icon: ShieldIcon, label: 'Admin', badge: pendingRequests }]
      : []),
  ]

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-safe pt-2 lg:hidden"
    >
      <div className="mx-auto flex h-18 max-w-md items-stretch rounded-[1.75rem] border border-border/70 bg-background/92 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/78 dark:shadow-[0_-12px_36px_rgba(0,0,0,0.28)]">
        {items.map((item) => (
          <TabItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            badge={item.badge}
          />
        ))}
      </div>
    </nav>
  )
}

/* ─── Pool nav (inside pool) ────────────────────────────────────────────────── */
function PoolBottomNav({ poolId, pathname }: { poolId: string; pathname: string }) {
  const items = [
    { href: `/pools/${poolId}/leaderboard`, icon: BarChart3Icon, label: 'Tabla',  exact: false },
    { href: `/pools/${poolId}/predictions`, icon: CalendarIcon,  label: 'Picks',  exact: false },
    { href: '/pools',                       icon: HomeIcon,       label: 'Inicio', exact: true  },
    { href: `/pools/${poolId}/payments`,    icon: WalletIcon,     label: 'Pagos',  exact: false },
    { href: `/pools/${poolId}/groups`,      icon: UsersIcon,      label: 'Grupos', exact: false },
  ]

  return (
    <nav
      aria-label="Navegación de quiniela"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-safe pt-2 lg:hidden"
    >
      <div className="mx-auto flex h-18 max-w-md items-stretch rounded-[1.75rem] border border-border/70 bg-background/92 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/78 dark:shadow-[0_-12px_36px_rgba(0,0,0,0.28)]">
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

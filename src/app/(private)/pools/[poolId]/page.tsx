import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarIcon, BarChart3Icon, TrophyIcon, UsersIcon, StarIcon,
  ShieldIcon, SettingsIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InvitePoolButton } from '@/components/pools/InvitePoolButton'

interface NavTileProps { href: string; icon: React.ElementType; label: string; desc: string }
function NavTile({ href, icon: Icon, label, desc }: NavTileProps) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted hover:border-primary/30 hover:shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 shrink-0">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  )
}

export default async function PoolPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pool } = await supabase
    .from('pools')
    .select('*, owner:profiles(full_name, nickname, avatar_url)')
    .eq('id', poolId)
    .single()

  if (!pool) notFound()

  // Check membership
  const { data: membership } = await supabase
    .from('pool_members')
    .select('id, joined_at')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single()

  if (!membership && pool.privacy === 'private') redirect('/pools')

  const { count: memberCount } = await supabase
    .from('pool_members')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId)
    .eq('is_active', true)

  const { data: myLeaderboard } = await supabase
    .from('leaderboard_snapshots')
    .select('total_points, position')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single()

  const isOwner = pool.owner_id === user.id

  const navTiles = [
    { href: `/pools/${poolId}/leaderboard`, icon: BarChart3Icon, label: 'Leaderboard', desc: 'Tabla de posiciones' },
    { href: `/pools/${poolId}/predictions`, icon: CalendarIcon, label: 'Predicciones', desc: 'Haz tus pronósticos' },
    { href: `/pools/${poolId}/groups`, icon: UsersIcon, label: 'Grupos', desc: 'Tabla del torneo' },
    { href: `/pools/${poolId}/bracket`, icon: TrophyIcon, label: 'Bracket', desc: 'Eliminatorias' },
    { href: `/pools/${poolId}/bonus`, icon: StarIcon, label: 'Bonus', desc: 'Predicciones especiales' },
    { href: `/pools/${poolId}/rules`, icon: ShieldIcon, label: 'Reglas', desc: 'Sistema de puntuación' },
  ]

  return (
    <div className="space-y-6">
      {/* Pool header */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6"
        style={{ borderColor: pool.primary_color + '40' }}>
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl sm:size-14 sm:text-3xl"
                style={{ backgroundColor: pool.primary_color + '20' }}>
                {pool.logo_url
                  ? <img src={pool.logo_url} alt="" className="size-12 rounded-lg object-cover" />
                  : '🏆'
                }
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <h1 className="break-words text-2xl font-bold leading-tight tracking-tight sm:text-xl">{pool.name}</h1>
                  <Badge variant={pool.privacy === 'public' ? 'info' : 'secondary'} className="shrink-0">
                    {pool.privacy === 'public' ? 'Pública' : 'Privada'}
                  </Badge>
                </div>
                {pool.description && <p className="mt-1 max-w-lg text-sm text-muted-foreground">{pool.description}</p>}
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                  <span className="flex items-center gap-1.5"><UsersIcon className="size-3.5 shrink-0" /> {memberCount ?? 0} participantes</span>
                  <span className="flex items-center gap-1.5"><CalendarIcon className="size-3.5 shrink-0" />
                    Creada {format(new Date(pool.created_at), 'd MMM yyyy', { locale: es })}
                  </span>
                  {pool.join_deadline && (
                    <span className="flex items-center gap-1.5">
                      Cierra {format(new Date(pool.join_deadline), 'd MMM', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
              <InvitePoolButton
                poolName={pool.name}
                inviteCode={pool.invite_code}
                className="w-full sm:w-auto"
              />
              {isOwner && (
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={`/pools/${poolId}/settings`}>
                    <SettingsIcon className="size-3.5 mr-1.5" /> Ajustes
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* My stats */}
        {myLeaderboard && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Mis puntos</p>
                <p className="text-2xl font-bold">{myLeaderboard.total_points}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Posición</p>
                <p className="text-2xl font-bold">#{myLeaderboard.position ?? '—'}</p>
              </div>
            </div>
          </>
        )}

        {pool.welcome_message && (
          <>
            <Separator className="my-4" />
            <p className="text-sm italic text-muted-foreground">💬 {pool.welcome_message}</p>
          </>
        )}
      </div>

      {/* Navigation grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {navTiles.map(t => <NavTile key={t.href} {...t} />)}
      </div>
    </div>
  )
}

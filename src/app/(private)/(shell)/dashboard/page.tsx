import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrophyIcon, CalendarIcon, BarChart3Icon, UsersIcon, PlusIcon, ArrowRightIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/shared/StatsCards'
import { PoolCard } from '@/components/pools/PoolCard'
import { JoinByCodeCard } from '@/components/pools/JoinByCodeCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Pool } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch pools the user belongs to
  const { data: memberPools } = await supabase
    .from('pool_members')
    .select('pool:pools(*, owner:profiles(full_name, nickname, avatar_url))')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(6)

  const pools = (memberPools?.map((m: any) => m.pool).filter(Boolean) ?? []) as Pool[]

  // User leaderboard positions
  const { data: leaderboard } = await supabase
    .from('leaderboard_snapshots')
    .select('total_points, exact_scores, pool_id')
    .eq('user_id', user.id)

  const totalPoints = leaderboard?.reduce((sum, l) => sum + (l.total_points ?? 0), 0) ?? 0
  const totalExact = leaderboard?.reduce((sum, l) => sum + (l.exact_scores ?? 0), 0) ?? 0

  // Upcoming matches
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id, scheduled_at, home_team:teams!matches_home_team_id_fkey(name, flag_emoji), away_team:teams!matches_away_team_id_fkey(name, flag_emoji)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bienvenido al Mundial 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mis Quinielas" value={pools.length} icon={TrophyIcon} subtitle="activas" />
        <StatCard title="Puntos Totales" value={totalPoints} icon={BarChart3Icon} subtitle="acumulados" />
        <StatCard title="Marcadores Exactos" value={totalExact} icon={CalendarIcon} subtitle="predicciones" />
        <StatCard title="Próximos Partidos" value={upcomingMatches?.length ?? 0} icon={UsersIcon} subtitle="para predecir" />
      </div>

      {/* My pools */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mis Quinielas</h2>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/pools">
                Ver todas <ArrowRightIcon className="ml-1.5 size-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/pools/new">
                <PlusIcon className="mr-1.5 size-3.5" /> Nueva
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <JoinByCodeCard
            title="Entrar con código"
            description="Si alguien te compartió un código, pégalo aquí para abrir la invitación."
          />
        </div>

        {pools.length === 0 ? (
          <EmptyState
            icon={TrophyIcon}
            title="Aún no tienes quinielas"
            description="Crea una quiniela o únete con un código de invitación."
            action={{ label: 'Crear quiniela', href: '/pools/new' }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
          </div>
        )}
      </section>

      {/* Upcoming matches */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Próximos Partidos</h2>
          <div className="grid gap-3">
            {upcomingMatches.map((match: any) => (
              <div key={match.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
                <span className="text-sm font-medium">
                  {match.home_team?.flag_emoji} {match.home_team?.name} vs {match.away_team?.flag_emoji} {match.away_team?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(match.scheduled_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

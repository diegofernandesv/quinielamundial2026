import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { StatCard } from '@/components/shared/StatsCards'
import { LeaderboardSkeleton } from '@/components/shared/LoadingSkeleton'
import { BarChart3Icon, TrophyIcon, ZapIcon, UsersIcon } from 'lucide-react'
import { Suspense } from 'react'
import type { LeaderboardEntry } from '@/types/database'

export default async function LeaderboardPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pool } = await supabase
    .from('pools')
    .select('name, primary_color')
    .eq('id', poolId)
    .single()

  const { data: entries } = await supabase
    .from('leaderboard_snapshots')
    .select('*, profile:profiles(id, full_name, nickname, avatar_url, country_code)')
    .eq('pool_id', poolId)
    .order('total_points', { ascending: false })
    .order('exact_scores', { ascending: false })

  const leaderboard = (entries ?? []) as LeaderboardEntry[]

  const leader = leaderboard[0]
  const myEntry = leaderboard.find(e => e.user_id === user.id)
  const totalPredictions = leaderboard.reduce((sum, e) => sum + e.predictions_made, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Clasificación actualizada en tiempo real</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Participantes" value={leaderboard.length} icon={UsersIcon} />
        <StatCard title="Líder" value={leader?.profile?.nickname ?? leader?.profile?.full_name ?? '—'} icon={TrophyIcon} />
        <StatCard title="Puntos del líder" value={leader?.total_points ?? 0} icon={BarChart3Icon} />
        <StatCard title="Tu posición" value={myEntry ? `#${myEntry.position ?? '—'}` : '—'} icon={ZapIcon}
          subtitle={myEntry ? `${myEntry.total_points} pts` : undefined} />
      </div>

      {/* Table */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardTable
          entries={leaderboard}
          currentUserId={user.id}
          poolName={pool?.name}
        />
      </Suspense>
    </div>
  )
}

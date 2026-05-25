import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PoolCard } from '@/components/pools/PoolCard'
import { JoinByCodeCard } from '@/components/pools/JoinByCodeCard'
import { PoolsActionButton } from '@/components/pools/PoolsActionButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrophyIcon } from 'lucide-react'
import type { Pool } from '@/types/database'

export default async function PoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [memberPoolsResult, profileResult] = await Promise.all([
    supabase
      .from('pool_members')
      .select(`
        joined_at,
        pool:pools(
          *,
          owner:profiles(full_name, nickname, avatar_url),
          scoring_rules(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
  ])

  const pools = (memberPoolsResult.data?.map((m: any) => m.pool).filter(Boolean) ?? []) as Pool[]
  const isAdmin = profileResult.data?.role === 'super_admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Quinielas</h1>
          <p className="text-muted-foreground mt-1">
            {pools.length} quiniela{pools.length !== 1 ? 's' : ''} activa{pools.length !== 1 ? 's' : ''}
          </p>
        </div>
        <PoolsActionButton isAdmin={isAdmin} />
      </div>

      <JoinByCodeCard />

      {pools.length === 0 ? (
        <EmptyState
          icon={TrophyIcon}
          title="No tienes quinielas todavía"
          description={
            isAdmin
              ? 'Crea tu primera quiniela o únete a una con un código de invitación.'
              : 'Únete a una quiniela con un código de invitación, o solicita acceso para crear la tuya.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PoolCard } from '@/components/pools/PoolCard'
import { JoinByCodeCard } from '@/components/pools/JoinByCodeCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrophyIcon } from 'lucide-react'
import type { Pool } from '@/types/database'

export default async function PoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberPools } = await supabase
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
    .order('joined_at', { ascending: false })

  const pools = (memberPools?.map((m: any) => m.pool).filter(Boolean) ?? []) as Pool[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Quinielas</h1>
          <p className="text-muted-foreground mt-1">{pools.length} quiniela{pools.length !== 1 ? 's' : ''} activa{pools.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/pools/new">
              <PlusIcon className="mr-1.5 size-4" />
              Nueva quiniela
            </Link>
          </Button>
        </div>
      </div>

      <JoinByCodeCard />

      {pools.length === 0 ? (
        <EmptyState
          icon={TrophyIcon}
          title="No tienes quinielas todavía"
          description="Crea tu primera quiniela o únete a una con un código de invitación."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      )}
    </div>
  )
}

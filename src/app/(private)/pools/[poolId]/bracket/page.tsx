import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BracketView } from '@/components/bracket/BracketView'
import type { Match, Prediction } from '@/types/database'

export default async function BracketPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .in('phase', ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'])
    .order('match_number', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)

  return (
    <BracketView
      matches={(matches ?? []) as Match[]}
      predictions={(predictions ?? []) as Prediction[]}
    />
  )
}

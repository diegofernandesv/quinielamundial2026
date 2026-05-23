import { createClient } from '@/lib/supabase/server'
import { ResultsEditor } from './ResultsEditor'
import type { Match } from '@/types/database'

export default async function AdminResultsPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(name, short_name, flag_emoji), away_team:teams!matches_away_team_id_fkey(name, short_name, flag_emoji)')
    .order('scheduled_at', { ascending: true })

  return <ResultsEditor initialMatches={(matches ?? []) as Match[]} />
}

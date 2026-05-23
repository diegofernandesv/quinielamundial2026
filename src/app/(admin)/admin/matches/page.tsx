import { createClient } from '@/lib/supabase/server'
import { MatchEditor } from './MatchEditor'
import type { Match, Team, TournamentGroup } from '@/types/database'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const [{ data: matches }, { data: teams }, { data: groups }] = await Promise.all([
    supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(id,name,flag_emoji), away_team:teams!matches_away_team_id_fkey(id,name,flag_emoji)').order('scheduled_at'),
    supabase.from('teams').select('id, name, short_name, flag_emoji').order('name'),
    supabase.from('tournament_groups').select('*').order('display_order'),
  ])
  return <MatchEditor initialMatches={(matches ?? []) as Match[]} teams={(teams ?? []) as Team[]} groups={(groups ?? []) as TournamentGroup[]} />
}

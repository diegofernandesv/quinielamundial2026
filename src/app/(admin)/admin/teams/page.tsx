import { createClient } from '@/lib/supabase/server'
import { TeamEditor } from './TeamEditor'
import type { Team, TournamentGroup } from '@/types/database'

export default async function AdminTeamsPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('teams').select('*').order('name')
  const { data: groups } = await supabase
    .from('tournament_groups')
    .select('*, group_teams(team_id)')
    .order('display_order')

  return (
    <TeamEditor
      initialTeams={(teams ?? []) as Team[]}
      groups={(groups ?? []) as (TournamentGroup & { group_teams: { team_id: string }[] })[]}
    />
  )
}

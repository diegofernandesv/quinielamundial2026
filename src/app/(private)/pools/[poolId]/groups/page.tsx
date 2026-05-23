import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupStandingsTable } from '@/components/groups/GroupStandingsTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { UsersIcon } from 'lucide-react'
import type { GroupStanding, Match, Team, TournamentGroup } from '@/types/database'

function computeStandings(teams: Team[], matches: Match[]): GroupStanding[] {
  const map = new Map<string, GroupStanding>()
  for (const team of teams) {
    map.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0 })
  }
  for (const match of matches) {
    if (match.status !== 'finished' || match.home_goals === null || match.away_goals === null) continue
    const home = map.get(match.home_team_id!)
    const away = map.get(match.away_team_id!)
    if (!home || !away) continue

    home.played++; away.played++
    home.goals_for += match.home_goals; home.goals_against += match.away_goals
    away.goals_for += match.away_goals; away.goals_against += match.home_goals

    if (match.home_goals > match.away_goals) {
      home.won++; home.points += 3; away.lost++
    } else if (match.home_goals < match.away_goals) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; away.drawn++; home.points++; away.points++
    }
  }
  const standings = Array.from(map.values()).map(s => ({
    ...s,
    goal_difference: s.goals_for - s.goals_against,
  }))
  standings.sort((a, b) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for ||
    a.team.name.localeCompare(b.team.name)
  )
  return standings.map((s, i) => ({ ...s, qualified: i < 2 ? 'top2' as const : null }))
}

export default async function GroupsPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: groups } = await supabase
    .from('tournament_groups')
    .select('*, group_teams(team:teams(*))')
    .order('display_order')

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('phase', 'group')
    .eq('status', 'finished')

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Grupos no disponibles"
        description="El administrador aún no ha cargado los grupos del torneo."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tabla de Grupos</h1>
        <p className="text-muted-foreground mt-1">Mundial 2026 — 12 grupos</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group: any) => {
          const teams = group.group_teams.map((gt: any) => gt.team).filter(Boolean) as Team[]
          const groupMatches = (matches ?? []) as Match[]
          const groupMatchesFiltered = groupMatches.filter(m =>
            teams.some(t => t.id === m.home_team_id || t.id === m.away_team_id)
          )
          const standings = computeStandings(teams, groupMatchesFiltered)
          return (
            <GroupStandingsTable key={group.id} groupName={group.name} standings={standings} />
          )
        })}
      </div>
    </div>
  )
}

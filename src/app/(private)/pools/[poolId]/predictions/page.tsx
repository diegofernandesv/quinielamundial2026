import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchPredictionCard } from '@/components/predictions/MatchPredictionCard'
import { GroupStandingsTable } from '@/components/groups/GroupStandingsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { CalendarIcon } from 'lucide-react'
import { PHASE_LABELS } from '@/types/database'
import type { GroupStanding, Match, Prediction, Team } from '@/types/database'

function computeProjectedStandings(teams: Team[], matches: Match[], predictionsMap: Map<string, Prediction>) {
  const map = new Map<string, GroupStanding>()

  for (const team of teams) {
    map.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    })
  }

  for (const match of matches) {
    const home = match.home_team_id ? map.get(match.home_team_id) : null
    const away = match.away_team_id ? map.get(match.away_team_id) : null
    if (!home || !away) continue

    let homeGoals: number | null = null
    let awayGoals: number | null = null

    if (match.status === 'finished' && match.home_goals !== null && match.away_goals !== null) {
      homeGoals = match.home_goals
      awayGoals = match.away_goals
    } else {
      const prediction = predictionsMap.get(match.id)
      if (prediction) {
        homeGoals = prediction.predicted_home_goals
        awayGoals = prediction.predicted_away_goals
      }
    }

    if (homeGoals === null || awayGoals === null) continue

    home.played += 1
    away.played += 1
    home.goals_for += homeGoals
    home.goals_against += awayGoals
    away.goals_for += awayGoals
    away.goals_against += homeGoals

    if (homeGoals > awayGoals) {
      home.won += 1
      home.points += 3
      away.lost += 1
    } else if (homeGoals < awayGoals) {
      away.won += 1
      away.points += 3
      home.lost += 1
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += 1
      away.points += 1
    }
  }

  const standings = Array.from(map.values()).map((standing) => ({
    ...standing,
    goal_difference: standing.goals_for - standing.goals_against,
  }))

  standings.sort((a, b) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for ||
    a.team.name.localeCompare(b.team.name)
  )

  return standings.map((standing, index) => ({
    ...standing,
    qualified: index < 2 ? 'top2' as const : null,
  }))
}

export default async function PredictionsPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check pool membership
  const { data: member } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/pools')

  // Load all matches with teams
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:tournament_groups(*)')
    .order('scheduled_at', { ascending: true })

  // Load user's predictions for this pool
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)

  const predMap = new Map((predictions ?? []).map((p: Prediction) => [p.match_id, p]))
  const matchList = (matches ?? []) as Match[]
  const groupStageByGroup = matchList
    .filter((match) => match.phase === 'group')
    .reduce<Record<string, Match[]>>((acc, match) => {
      const groupName = match.group?.name ?? 'Sin grupo'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(match)
      return acc
    }, {})
  const orderedGroupNames = Object.keys(groupStageByGroup).sort((groupA, groupB) => groupA.localeCompare(groupB))
  const groupTeamsByGroup = orderedGroupNames.reduce<Record<string, Team[]>>((acc, groupName) => {
    acc[groupName] = Array.from(
      new Map(
        groupStageByGroup[groupName]
          .flatMap((match) => [match.home_team, match.away_team])
          .filter(Boolean)
          .map((team) => [(team as Team).id, team as Team])
      ).values()
    )
    return acc
  }, {})

  // Group by phase
  const grouped = PHASE_LABELS.reduce<Record<string, Match[]>>((acc, phase) => {
    const phaseMatches = matchList.filter(m => m.phase === phase.value)
    if (phaseMatches.length > 0) acc[phase.value] = phaseMatches
    return acc
  }, {})

  const phases = Object.keys(grouped)
  const defaultTab = phases[0] ?? 'group'

  // Count predictions
  const totalMatches = matchList.length
  const predicted = (predictions ?? []).length
  const upcoming = matchList.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Predicciones</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">
            {predicted}/{totalMatches} predicciones · {upcoming} partido{upcoming !== 1 ? 's' : ''} pendiente{upcoming !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Badge variant="info">{upcoming} por predecir</Badge>
        </div>
      </div>

      {phases.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No hay partidos cargados"
          description="El administrador aún no ha cargado el calendario del torneo."
        />
      ) : (
        <Tabs defaultValue={defaultTab}>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-auto min-w-max gap-1 whitespace-nowrap">
              {PHASE_LABELS.filter(p => grouped[p.value]).map(phase => (
                <TabsTrigger
                  key={phase.value}
                  value={phase.value}
                  className="border-transparent text-xs text-muted-foreground data-[active]:border-white data-[active]:bg-white data-[active]:text-black data-[active]:shadow-sm dark:data-[active]:border-white dark:data-[active]:bg-white dark:data-[active]:text-black"
                >
                  {phase.short}
                  <span className="ml-1.5 opacity-60 text-xs">{grouped[phase.value]?.length ?? 0}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {PHASE_LABELS.filter(p => grouped[p.value]).map(phase => (
            <TabsContent key={phase.value} value={phase.value}>
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-muted-foreground">{phase.label}</h2>
                {phase.value === 'group' ? (
                  <Tabs defaultValue={orderedGroupNames[0]} className="space-y-4">
                    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                      <TabsList className="inline-flex h-auto min-w-max gap-1 whitespace-nowrap">
                        {orderedGroupNames.map((groupName) => (
                          <TabsTrigger
                            key={groupName}
                            value={groupName}
                            className="border-transparent text-xs text-muted-foreground data-[active]:border-white data-[active]:bg-white data-[active]:text-black data-[active]:shadow-sm dark:data-[active]:border-white dark:data-[active]:bg-white dark:data-[active]:text-black"
                          >
                            Grupo {groupName}
                            <span className="ml-1.5 opacity-60 text-xs">{groupStageByGroup[groupName]?.length ?? 0}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {orderedGroupNames.map((groupName) => (
                      <TabsContent key={groupName} value={groupName} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Grupo {groupName}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {groupStageByGroup[groupName].length} partido{groupStageByGroup[groupName].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {groupStageByGroup[groupName].map(match => (
                          <MatchPredictionCard
                            key={match.id}
                            match={match}
                            prediction={predMap.get(match.id) ?? null}
                            poolId={poolId}
                            userId={user.id}
                          />
                        ))}
                        <div className="pt-2">
                          <GroupStandingsTable
                            groupName={groupName}
                            standings={computeProjectedStandings(
                              groupTeamsByGroup[groupName],
                              groupStageByGroup[groupName],
                              predMap
                            )}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  grouped[phase.value].map(match => (
                    <MatchPredictionCard
                      key={match.id}
                      match={match}
                      prediction={predMap.get(match.id) ?? null}
                      poolId={poolId}
                      userId={user.id}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

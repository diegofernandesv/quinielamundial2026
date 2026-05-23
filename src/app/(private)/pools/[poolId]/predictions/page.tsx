import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchPredictionCard } from '@/components/predictions/MatchPredictionCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { CalendarIcon } from 'lucide-react'
import { PHASE_LABELS } from '@/types/database'
import type { Match, Prediction } from '@/types/database'

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predicciones</h1>
          <p className="text-muted-foreground mt-1">
            {predicted}/{totalMatches} predicciones · {upcoming} partido{upcoming !== 1 ? 's' : ''} pendiente{upcoming !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
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
          <TabsList className="flex-wrap h-auto gap-1 mb-2">
            {PHASE_LABELS.filter(p => grouped[p.value]).map(phase => (
              <TabsTrigger key={phase.value} value={phase.value} className="text-xs">
                {phase.short}
                <span className="ml-1.5 opacity-60 text-xs">{grouped[phase.value]?.length ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {PHASE_LABELS.filter(p => grouped[p.value]).map(phase => (
            <TabsContent key={phase.value} value={phase.value}>
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-muted-foreground">{phase.label}</h2>
                {grouped[phase.value].map(match => (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    prediction={predMap.get(match.id) ?? null}
                    poolId={poolId}
                    userId={user.id}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

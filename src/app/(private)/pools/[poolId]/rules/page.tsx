import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PHASE_LABELS } from '@/types/database'
import type { ScoringRules } from '@/types/database'

export default async function RulesPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rules } = await supabase
    .from('scoring_rules')
    .select('*')
    .eq('pool_id', poolId)
    .single()

  if (!rules) return <p className="text-muted-foreground">No hay reglas configuradas.</p>

  const r = rules as ScoringRules

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reglas de Puntuación</h1>
        <p className="text-muted-foreground mt-1">Sistema de puntos de esta quiniela</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Puntos base por partido</CardTitle>
          <CardDescription>Aplicados a cada predicción de partido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RuleRow label="Marcador exacto" value={r.exact_score_points} active />
          <RuleRow label="Resultado correcto (G/E/P)" value={r.correct_result_points} active />
          <RuleRow label="Empate correcto" value={r.correct_draw_points} active />
          {r.enable_goal_difference_bonus && (
            <RuleRow label="Diferencia de goles correcta" value={r.goal_difference_bonus} active={r.enable_goal_difference_bonus} />
          )}
          {r.enable_team_goals_bonus && (
            <>
              <RuleRow label="Goles del equipo local" value={r.home_goals_bonus} active={r.enable_team_goals_bonus} />
              <RuleRow label="Goles del equipo visitante" value={r.away_goals_bonus} active={r.enable_team_goals_bonus} />
            </>
          )}
        </CardContent>
      </Card>

      {r.enable_bonus_predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Predicciones bonus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RuleRow label="Campeón correcto" value={r.champion_bonus} active />
            <RuleRow label="Subcampeón correcto" value={r.runner_up_bonus} active />
            <RuleRow label="Semifinalista correcto (c/u)" value={r.semifinalist_bonus} active />
          </CardContent>
        </Card>
      )}

      {r.enable_phase_multipliers && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multiplicadores por fase</CardTitle>
            <CardDescription>Los puntos se multiplican según la fase del partido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PHASE_LABELS.map(phase => (
              <div key={phase.value} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm">{phase.label}</span>
                <Badge variant="outline" className="font-mono">×{r.phase_multipliers[phase.value]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RuleRow({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <Badge variant={active ? 'success' : 'secondary'} className="font-bold">
        {active ? `+${value} pts` : 'Desactivado'}
      </Badge>
    </div>
  )
}

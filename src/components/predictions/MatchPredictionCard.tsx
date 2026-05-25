"use client"
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SaveIcon, Loader2Icon, LockIcon, CheckCircle2Icon, CircleDotIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScoreInput } from './ScoreInput'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Match, Prediction, PredictionStatus } from '@/types/database'

interface MatchPredictionCardProps {
  match: Match
  prediction: Prediction | null
  poolId: string
  userId: string
}

const statusConfig: Record<PredictionStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: CircleDotIcon },
  locked: { label: 'Bloqueada', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: LockIcon },
  scored: { label: 'Calificada', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2Icon },
  no_prediction: { label: 'Sin predicción', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: CircleDotIcon },
}

export function MatchPredictionCard({ match, prediction, poolId, userId }: MatchPredictionCardProps) {
  const supabase = createClient()
  const isLocked = prediction?.is_locked || match.status !== 'scheduled' || new Date(match.scheduled_at) <= new Date()
  const [homeGoals, setHomeGoals] = useState(prediction?.predicted_home_goals ?? 0)
  const [awayGoals, setAwayGoals] = useState(prediction?.predicted_away_goals ?? 0)
  const [saving, setSaving] = useState(false)

  // Prediction status
  let status: PredictionStatus = 'no_prediction'
  if (match.status === 'finished') status = prediction ? 'scored' : 'no_prediction'
  else if (isLocked) status = 'locked'
  else if (prediction) status = 'pending'

  const { label, className: badgeClass, icon: StatusIcon } = statusConfig[status]

  async function savePrediction() {
    if (isLocked) return
    setSaving(true)
    const payload = {
      pool_id: poolId,
      user_id: userId,
      match_id: match.id,
      predicted_home_goals: homeGoals,
      predicted_away_goals: awayGoals,
    }
    const { error } = prediction
      ? await supabase.from('predictions').update(payload).eq('id', prediction.id)
      : await supabase.from('predictions').insert(payload)
    setSaving(false)
    if (error) { toast.error('Error al guardar: ' + error.message); return }
    toast.success('Predicción guardada')
  }

  const realResult = match.status === 'finished' && match.home_goals !== null
    ? `${match.home_goals} - ${match.away_goals}`
    : null

  const pointsEarned = prediction?.points_earned

  return (
    <Card className={cn("transition-all", isLocked && "opacity-90")}>
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-muted-foreground">
            <span className="block sm:inline">
              {format(new Date(match.scheduled_at), "EEE d MMM · HH:mm", { locale: es })}
            </span>
            {match.city && <span className="mt-0.5 block truncate sm:mt-0 sm:ml-2 sm:inline">{match.city}</span>}
          </div>
          <div className={cn("flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", badgeClass)}>
            <StatusIcon className="size-3" />
            {label}
          </div>
        </div>

        {/* Match */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          {/* Home team */}
          <div className="flex items-center justify-between gap-3 sm:flex-1 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
            <span className="text-lg sm:hidden">{match.home_team?.flag_emoji ?? '🏳'}</span>
            <span className="text-sm font-semibold sm:text-right">{match.home_team?.name ?? 'Por definir'}</span>
            <span className="hidden text-lg sm:block">{match.home_team?.flag_emoji ?? '🏳'}</span>
          </div>

          {/* Score inputs / result */}
          <div className="flex shrink-0 flex-col items-center gap-2 self-center">
            {match.status === 'finished' ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{match.home_goals}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-2xl font-bold">{match.away_goals}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ScoreInput value={homeGoals} onChange={setHomeGoals} disabled={isLocked} />
                <span className="text-muted-foreground font-bold">—</span>
                <ScoreInput value={awayGoals} onChange={setAwayGoals} disabled={isLocked} />
              </div>
            )}

            {/* Prediction vs real */}
            {prediction && match.status === 'finished' && (
              <div className="text-center text-xs text-muted-foreground">
                Tu pred: <span className="font-medium text-foreground">{prediction.predicted_home_goals} - {prediction.predicted_away_goals}</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center justify-between gap-3 sm:flex-1 sm:flex-col sm:items-start sm:justify-center sm:gap-1">
            <span className="hidden text-lg sm:block">{match.away_team?.flag_emoji ?? '🏳'}</span>
            <span className="text-sm font-semibold">{match.away_team?.name ?? 'Por definir'}</span>
            <span className="text-lg sm:hidden">{match.away_team?.flag_emoji ?? '🏳'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {match.phase !== 'group' && <Badge variant="outline" className="text-xs">{match.round_label ?? match.phase}</Badge>}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {pointsEarned !== null && pointsEarned !== undefined && (
              <span className={cn("text-sm font-bold", pointsEarned > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {pointsEarned > 0 ? '+' : ''}{pointsEarned} pts
              </span>
            )}
            {!isLocked && (
              <Button size="sm" onClick={savePrediction} disabled={saving} className="h-10 w-full sm:h-7 sm:w-auto">
                {saving ? <Loader2Icon className="size-3.5 animate-spin mr-1.5" /> : <SaveIcon className="size-3.5 mr-1.5" />}
                Guardar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

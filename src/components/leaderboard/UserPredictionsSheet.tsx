"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon, MinusCircleIcon } from 'lucide-react'
import { formatMatchDate, formatPoints } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/database'

interface ScoredPrediction {
  id: string
  predicted_home_goals: number
  predicted_away_goals: number
  points_earned: number | null
  match: {
    id: string
    home_goals: number | null
    away_goals: number | null
    status: string
    scheduled_at: string
    phase: string
    home_team: { name: string; short_name: string; flag_emoji: string | null } | null
    away_team: { name: string; short_name: string; flag_emoji: string | null } | null
  }
}

const phaseLabels: Record<string, string> = {
  group: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos',
  quarter_final: 'Cuartos',
  semi_final: 'Semifinal',
  third_place: 'Tercer lugar',
  final: 'Final',
}

interface Props {
  entry: LeaderboardEntry | null
  poolId: string
  onClose: () => void
}

export function UserPredictionsSheet({ entry, poolId, onClose }: Props) {
  const [predictions, setPredictions] = useState<ScoredPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!entry) return
    setLoading(true)
    supabase
      .from('predictions')
      .select(`
        id, predicted_home_goals, predicted_away_goals, points_earned,
        match:matches(
          id, home_goals, away_goals, status, scheduled_at, phase,
          home_team:teams!matches_home_team_id_fkey(name, short_name, flag_emoji),
          away_team:teams!matches_away_team_id_fkey(name, short_name, flag_emoji)
        )
      `)
      .eq('pool_id', poolId)
      .eq('user_id', entry.user_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPredictions((data ?? []) as unknown as ScoredPrediction[])
        setLoading(false)
      })
  }, [entry?.user_id, poolId])

  const displayName = entry?.profile?.nickname ?? entry?.profile?.full_name ?? 'Usuario'

  const scored = predictions.filter(p => p.match.status === 'finished')
  const pending = predictions.filter(p => p.match.status !== 'finished')
  const totalPoints = scored.reduce((sum, p) => sum + (p.points_earned ?? 0), 0)

  return (
    <Sheet open={!!entry} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              profile={entry?.profile ?? { full_name: displayName, nickname: null, avatar_url: null }}
              size="md"
            />
            <div>
              <SheetTitle className="text-base">{displayName}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                #{entry?.position} · {formatPoints(entry?.total_points)} pts totales
              </p>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : predictions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Sin predicciones aún</p>
        ) : (
          <div className="space-y-5">
            {scored.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Calificados · {scored.length}
                  </h3>
                  <span className="text-xs font-bold text-primary">{formatPoints(totalPoints)} pts</span>
                </div>
                {scored.map(p => (
                  <PredictionRow key={p.id} prediction={p} />
                ))}
              </section>
            )}

            {pending.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pendientes · {pending.length}
                </h3>
                {pending.map(p => (
                  <PredictionRow key={p.id} prediction={p} />
                ))}
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PredictionRow({ prediction: p }: { prediction: ScoredPrediction }) {
  const { match } = p
  const isFinished = match.status === 'finished'
  const pts = p.points_earned ?? 0

  const isExact = isFinished &&
    p.predicted_home_goals === match.home_goals &&
    p.predicted_away_goals === match.away_goals

  const predResult = p.predicted_home_goals > p.predicted_away_goals ? 'home'
    : p.predicted_away_goals > p.predicted_home_goals ? 'away' : 'draw'
  const realResult = isFinished && match.home_goals !== null
    ? (match.home_goals > match.away_goals! ? 'home' : match.away_goals! > match.home_goals ? 'away' : 'draw')
    : null
  const isCorrect = isFinished && realResult === predResult
  const hasPoints = isFinished && pts > 0

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      isExact && "border-emerald-500/40 bg-emerald-500/5",
      !isExact && isCorrect && "border-blue-500/30 bg-blue-500/5",
      isFinished && !hasPoints && "opacity-60",
    )}>
      {/* Match header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{phaseLabels[match.phase] ?? match.phase}</span>
        <span className="text-xs text-muted-foreground">{formatMatchDate(match.scheduled_at)}</span>
      </div>

      {/* Teams + scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Home */}
        <div className="text-right">
          <span className="text-sm font-medium">
            {match.home_team?.flag_emoji} {match.home_team?.short_name}
          </span>
        </div>

        {/* Score block */}
        <div className="flex flex-col items-center gap-0.5">
          {/* Prediction */}
          <div className="flex items-center gap-1 text-sm font-bold tabular-nums">
            <span>{p.predicted_home_goals}</span>
            <span className="text-muted-foreground">-</span>
            <span>{p.predicted_away_goals}</span>
          </div>
          {/* Real result */}
          {isFinished && match.home_goals !== null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <span>({match.home_goals}</span>
              <span>-</span>
              <span>{match.away_goals})</span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="text-left">
          <span className="text-sm font-medium">
            {match.away_team?.short_name} {match.away_team?.flag_emoji}
          </span>
        </div>
      </div>

      {/* Points row */}
      {isFinished && (
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            {isExact ? (
              <><CheckCircle2Icon className="size-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400 font-medium">Exacto</span></>
            ) : isCorrect ? (
              <><CheckCircle2Icon className="size-3.5 text-blue-500" /><span className="text-blue-600 dark:text-blue-400 font-medium">Resultado correcto</span></>
            ) : (
              <><XCircleIcon className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Sin puntos</span></>
            )}
          </div>
          <Badge variant={pts > 0 ? 'success' : 'secondary'} className="text-xs tabular-nums">
            {pts > 0 ? `+${formatPoints(pts)}` : '0'} pts
          </Badge>
        </div>
      )}

      {!isFinished && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
          <MinusCircleIcon className="size-3.5" />
          <span>{match.status === 'live' ? 'En vivo' : 'Pendiente'}</span>
        </div>
      )}
    </div>
  )
}

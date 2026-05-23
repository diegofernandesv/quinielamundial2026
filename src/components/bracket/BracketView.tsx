"use client"
import { useMemo } from 'react'
import { TrophyIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PHASE_LABELS } from '@/types/database'
import { cn } from '@/lib/utils'
import type { Match, Prediction } from '@/types/database'

interface BracketViewProps { matches: Match[]; predictions: Prediction[] }

const BRACKET_PHASES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'] as const

function MatchSlot({ match, prediction }: { match: Match; prediction?: Prediction }) {
  const home = match.home_team as any
  const away = match.away_team as any
  const finished = match.status === 'finished'
  const homeWon = finished && match.home_goals !== null && match.away_goals !== null && match.home_goals > match.away_goals
  const awayWon = finished && match.home_goals !== null && match.away_goals !== null && match.away_goals > match.home_goals

  return (
    <div className="rounded-lg border bg-card w-48 overflow-hidden text-xs shadow-sm">
      {match.round_label && (
        <div className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium">{match.round_label}</div>
      )}
      <div className={cn("flex items-center justify-between px-2 py-1.5 border-b", homeWon && "bg-emerald-50 dark:bg-emerald-950/20")}>
        <span className="flex items-center gap-1.5 font-medium truncate">
          <span className="text-base leading-none">{home?.flag_emoji ?? '🏳'}</span>
          <span className="truncate">{home?.short_name ?? '???'}</span>
        </span>
        <span className={cn("font-bold ml-2", homeWon && "text-emerald-600 dark:text-emerald-400")}>
          {match.home_goals ?? (prediction ? prediction.predicted_home_goals : '—')}
        </span>
      </div>
      <div className={cn("flex items-center justify-between px-2 py-1.5", awayWon && "bg-emerald-50 dark:bg-emerald-950/20")}>
        <span className="flex items-center gap-1.5 font-medium truncate">
          <span className="text-base leading-none">{away?.flag_emoji ?? '🏳'}</span>
          <span className="truncate">{away?.short_name ?? '???'}</span>
        </span>
        <span className={cn("font-bold ml-2", awayWon && "text-emerald-600 dark:text-emerald-400")}>
          {match.away_goals ?? (prediction ? prediction.predicted_away_goals : '—')}
        </span>
      </div>
      {prediction && match.status === 'finished' && prediction.points_earned !== null && (
        <div className={cn("px-2 py-0.5 text-[10px] font-medium", (prediction.points_earned ?? 0) > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
          {(prediction.points_earned ?? 0) > 0 ? `+${prediction.points_earned} pts` : 'Sin puntos'}
        </div>
      )}
    </div>
  )
}

export function BracketView({ matches, predictions }: BracketViewProps) {
  const predMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions])

  const byPhase = useMemo(() =>
    BRACKET_PHASES.reduce<Record<string, Match[]>>((acc, phase) => {
      const phaseMatches = matches.filter(m => m.phase === phase)
      if (phaseMatches.length > 0) acc[phase] = phaseMatches
      return acc
    }, {}),
    [matches]
  )

  // Winner
  const finalMatch = matches.find(m => m.phase === 'final' && m.status === 'finished')
  const champion = finalMatch?.winner_team_id
    ? (finalMatch.home_team_id === finalMatch.winner_team_id ? finalMatch.home_team : finalMatch.away_team) as any
    : null

  if (matches.length === 0) {
    return <EmptyState icon={TrophyIcon} title="Bracket no disponible" description="La fase eliminatoria comenzará después de la fase de grupos." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bracket Eliminatorio</h1>
        <p className="text-muted-foreground mt-1">
          {matches.filter(m => m.status === 'finished').length} de {matches.length} partidos finalizados
        </p>
      </div>

      {champion && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4">
          <span className="text-3xl">{champion.flag_emoji ?? '🏆'}</span>
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">Campeón Mundial 2026</p>
            <p className="text-xl font-bold">{champion.name}</p>
          </div>
          <TrophyIcon className="ml-auto size-8 text-amber-500" />
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max">
          {BRACKET_PHASES.filter(p => byPhase[p]).map(phase => {
            const label = PHASE_LABELS.find(l => l.value === phase)
            return (
              <div key={phase} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground text-center">{label?.label}</h3>
                <div className="flex flex-col gap-3">
                  {byPhase[phase].map(match => (
                    <MatchSlot key={match.id} match={match} prediction={predMap.get(match.id)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

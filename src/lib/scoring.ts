import type { Match, Prediction, ScoringRules } from '@/types/database'

export function calculatePoints(
  match: Match,
  prediction: Prediction,
  rules: ScoringRules
): number {
  if (match.status !== 'finished' || match.home_goals === null || match.away_goals === null) return 0

  const realResult = getResult(match.home_goals, match.away_goals)
  const predResult = getResult(prediction.predicted_home_goals, prediction.predicted_away_goals)
  const multiplier = rules.enable_phase_multipliers
    ? (rules.phase_multipliers[match.phase] ?? 1)
    : 1

  let points = 0

  if (prediction.predicted_home_goals === match.home_goals && prediction.predicted_away_goals === match.away_goals) {
    points += rules.exact_score_points
  } else {
    if (predResult === realResult) {
      points += realResult === 'draw' ? rules.correct_draw_points : rules.correct_result_points
    }
    if (rules.enable_goal_difference_bonus) {
      const realDiff = match.home_goals - match.away_goals
      const predDiff = prediction.predicted_home_goals - prediction.predicted_away_goals
      if (realDiff === predDiff) points += rules.goal_difference_bonus
    }
    if (rules.enable_team_goals_bonus) {
      if (prediction.predicted_home_goals === match.home_goals) points += rules.home_goals_bonus
      if (prediction.predicted_away_goals === match.away_goals) points += rules.away_goals_bonus
    }
  }

  return points * multiplier
}

export function getResult(homeGoals: number, awayGoals: number): 'home' | 'away' | 'draw' {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

export function getPredictionStatus(match: Match, prediction?: Prediction | null) {
  if (!prediction) return 'no_prediction'
  if (match.status === 'finished') return 'scored'
  if (prediction.is_locked || match.status === 'live') return 'locked'
  return 'pending'
}

export const DEFAULT_RULES: Omit<ScoringRules, 'id' | 'pool_id' | 'created_at' | 'updated_at'> = {
  exact_score_points: 5,
  correct_result_points: 3,
  correct_draw_points: 3,
  goal_difference_bonus: 1,
  home_goals_bonus: 1,
  away_goals_bonus: 1,
  champion_bonus: 10,
  runner_up_bonus: 6,
  semifinalist_bonus: 4,
  phase_multipliers: {
    group: 1,
    round_of_32: 1.5,
    round_of_16: 2,
    quarter_final: 2.5,
    semi_final: 3,
    third_place: 2,
    final: 4,
  },
  enable_goal_difference_bonus: true,
  enable_team_goals_bonus: true,
  enable_phase_multipliers: true,
  enable_bonus_predictions: true,
}

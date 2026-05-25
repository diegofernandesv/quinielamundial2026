export type UserRole = 'player' | 'pending_admin' | 'pool_admin' | 'super_admin'
export type MatchPhase = 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'
export type PoolPrivacy = 'public' | 'private'
export type PredictionStatus = 'pending' | 'locked' | 'scored' | 'no_prediction'
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface Profile {
  id: string
  email: string
  nickname: string | null
  full_name: string | null
  avatar_url: string | null
  country_code: string | null
  favorite_team_id: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string
  flag_emoji: string | null
  flag_url: string | null
  confederation: string | null
  created_at: string
  updated_at: string
}

export interface TournamentGroup {
  id: string
  name: string
  display_order: number
  created_at: string
}

export interface GroupTeam {
  id: string
  group_id: string
  team_id: string
  created_at: string
}

export interface Match {
  id: string
  home_team_id: string | null
  away_team_id: string | null
  group_id: string | null
  phase: MatchPhase
  match_number: number | null
  round_label: string | null
  stadium: string | null
  city: string | null
  scheduled_at: string
  status: MatchStatus
  home_goals: number | null
  away_goals: number | null
  home_goals_extra: number | null
  away_goals_extra: number | null
  home_goals_penalties: number | null
  away_goals_penalties: number | null
  winner_team_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  home_team?: Team
  away_team?: Team
  group?: TournamentGroup
}

export interface Pool {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  invite_code: string
  privacy: PoolPrivacy
  owner_id: string
  max_members: number | null
  join_deadline: string | null
  bonus_deadline: string | null
  is_active: boolean
  primary_color: string
  secondary_color: string
  welcome_message: string | null
  created_at: string
  updated_at: string
  // Joined
  owner?: Profile
  member_count?: number
  scoring_rules?: ScoringRules
}

export interface PhaseMultipliers {
  group: number
  round_of_32: number
  round_of_16: number
  quarter_final: number
  semi_final: number
  third_place: number
  final: number
}

export interface ScoringRules {
  id: string
  pool_id: string
  exact_score_points: number
  correct_result_points: number
  correct_draw_points: number
  goal_difference_bonus: number
  home_goals_bonus: number
  away_goals_bonus: number
  champion_bonus: number
  runner_up_bonus: number
  semifinalist_bonus: number
  phase_multipliers: PhaseMultipliers
  enable_goal_difference_bonus: boolean
  enable_team_goals_bonus: boolean
  enable_phase_multipliers: boolean
  enable_bonus_predictions: boolean
  created_at: string
  updated_at: string
}

export interface PoolMember {
  id: string
  pool_id: string
  user_id: string
  joined_at: string
  is_active: boolean
  // Joined
  profile?: Profile
}

export interface PoolInvite {
  id: string
  pool_id: string
  invited_by: string
  invited_email: string | null
  invite_code: string
  status: InviteStatus
  expires_at: string
  created_at: string
}

export interface Prediction {
  id: string
  pool_id: string
  user_id: string
  match_id: string
  predicted_home_goals: number
  predicted_away_goals: number
  predicted_result: 'home' | 'away' | 'draw'
  predicted_winner_id: string | null
  is_locked: boolean
  points_earned: number | null
  scored_at: string | null
  created_at: string
  updated_at: string
  // Joined
  match?: Match
}

export interface BonusPrediction {
  id: string
  pool_id: string
  user_id: string
  champion_team_id: string | null
  runner_up_team_id: string | null
  semifinalist_1_id: string | null
  semifinalist_2_id: string | null
  is_locked: boolean
  champion_points: number
  runner_up_points: number
  semifinalist_points: number
  total_bonus_points: number
  created_at: string
  updated_at: string
  // Joined
  champion_team?: Team
  runner_up_team?: Team
  semifinalist_1?: Team
  semifinalist_2?: Team
}

export interface LeaderboardSnapshot {
  id: string
  pool_id: string
  user_id: string
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_made: number
  bonus_points: number
  position: number | null
  previous_position: number | null
  last_calculated_at: string
  // Joined
  profile?: Profile
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  // Joined
  actor?: Profile
}

// ============================================================
// Computed / Derived Types
// ============================================================

export interface GroupStanding {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  qualified?: 'top2' | 'best_third' | null
}

export interface LeaderboardEntry extends LeaderboardSnapshot {
  trend: 'up' | 'down' | 'same' | null
  profile: Profile
}

export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null
  prediction_status: PredictionStatus
}

export type PhaseLabel = {
  value: MatchPhase
  label: string
  short: string
}

export const PHASE_LABELS: PhaseLabel[] = [
  { value: 'group', label: 'Fase de Grupos', short: 'Grupos' },
  { value: 'round_of_32', label: 'Ronda de 32', short: 'R32' },
  { value: 'round_of_16', label: 'Octavos de Final', short: 'Octavos' },
  { value: 'quarter_final', label: 'Cuartos de Final', short: 'Cuartos' },
  { value: 'semi_final', label: 'Semifinales', short: 'Semis' },
  { value: 'third_place', label: 'Tercer Lugar', short: '3er Lugar' },
  { value: 'final', label: 'Final', short: 'Final' },
]

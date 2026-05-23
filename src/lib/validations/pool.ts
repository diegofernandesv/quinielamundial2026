import { z } from 'zod'

export const createPoolSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'private']),
  max_members: z.coerce.number().int().positive().optional(),
  join_deadline: z.string().optional(),
  bonus_deadline: z.string().optional(),
  welcome_message: z.string().max(300).optional(),
})

export const updatePoolSchema = createPoolSchema.partial()

export const scoringRulesSchema = z.object({
  exact_score_points: z.coerce.number().int().min(0).max(20),
  correct_result_points: z.coerce.number().int().min(0).max(10),
  correct_draw_points: z.coerce.number().int().min(0).max(10),
  goal_difference_bonus: z.coerce.number().int().min(0).max(5),
  home_goals_bonus: z.coerce.number().int().min(0).max(5),
  away_goals_bonus: z.coerce.number().int().min(0).max(5),
  champion_bonus: z.coerce.number().int().min(0).max(50),
  runner_up_bonus: z.coerce.number().int().min(0).max(30),
  semifinalist_bonus: z.coerce.number().int().min(0).max(20),
  enable_goal_difference_bonus: z.boolean(),
  enable_team_goals_bonus: z.boolean(),
  enable_phase_multipliers: z.boolean(),
  enable_bonus_predictions: z.boolean(),
})

export type CreatePoolInput = z.infer<typeof createPoolSchema>
export type ScoringRulesInput = z.infer<typeof scoringRulesSchema>

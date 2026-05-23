import { z } from 'zod'

export const predictionSchema = z.object({
  predicted_home_goals: z.coerce.number().int().min(0, 'Mínimo 0').max(20, 'Máximo 20'),
  predicted_away_goals: z.coerce.number().int().min(0, 'Mínimo 0').max(20, 'Máximo 20'),
  predicted_winner_id: z.string().uuid().optional(),
})

export const bonusPredictionSchema = z.object({
  champion_team_id: z.string().uuid().optional(),
  runner_up_team_id: z.string().uuid().optional(),
  semifinalist_1_id: z.string().uuid().optional(),
  semifinalist_2_id: z.string().uuid().optional(),
})

export type PredictionInput = z.infer<typeof predictionSchema>
export type BonusPredictionInput = z.infer<typeof bonusPredictionSchema>

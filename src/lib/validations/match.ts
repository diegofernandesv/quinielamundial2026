import { z } from 'zod'

export const matchSchema = z.object({
  home_team_id: z.string().uuid().optional(),
  away_team_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  phase: z.enum(['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']),
  match_number: z.coerce.number().int().positive().optional(),
  round_label: z.string().max(50).optional(),
  stadium: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  scheduled_at: z.string().datetime(),
})

export const matchResultSchema = z.object({
  home_goals: z.coerce.number().int().min(0),
  away_goals: z.coerce.number().int().min(0),
  status: z.enum(['scheduled', 'live', 'finished']),
  winner_team_id: z.string().uuid().optional(),
})

export type MatchInput = z.infer<typeof matchSchema>
export type MatchResultInput = z.infer<typeof matchResultSchema>

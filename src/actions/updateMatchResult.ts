'use server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { matchResultSchema } from '@/lib/validations/match'

export async function updateMatchResult(matchId: string, data: unknown) {
  const parsed = matchResultSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // Verify the caller is super_admin
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'pool_admin'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  // Use service role to bypass RLS
  const admin = await createAdminClient()

  // 1. Update match
  const { error: matchError } = await admin
    .from('matches')
    .update(parsed.data)
    .eq('id', matchId)

  if (matchError) return { error: matchError.message }

  // 2. If finished, score predictions and recalculate leaderboards
  if (parsed.data.status === 'finished') {
    const { error: scoreError } = await admin.rpc('score_match_predictions', { p_match_id: matchId })
    if (scoreError) return { error: `Score error: ${scoreError.message}` }

    // Get all pools with predictions for this match
    const { data: poolIds } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)

    const distinct = [...new Set((poolIds ?? []).map(p => p.pool_id))]
    for (const poolId of distinct) {
      await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
    }
  }

  return { success: true }
}

'use server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { matchResultSchema } from '@/lib/validations/match'

export async function updateMatchResult(matchId: string, data: unknown) {
  const parsed = matchResultSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'pool_admin'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const admin = await createAdminClient()

  // Get current match status before updating
  const { data: current } = await admin
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  const wasFinished = current?.status === 'finished'
  const isNowFinished = parsed.data.status === 'finished'
  const isReverting = wasFinished && !isNowFinished

  // When reverting finished → scheduled/live, clear goals so it's clean
  const updatePayload = isReverting
    ? { ...parsed.data, home_goals: null, away_goals: null }
    : parsed.data

  const { error: matchError } = await admin
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId)

  if (matchError && !matchError.message.includes('ambiguous')) {
    return { error: matchError.message }
  }

  if (isReverting) {
    // Reset predictions: clear points, unlock, unscored
    await admin
      .from('predictions')
      .update({ points_earned: null, scored_at: null, is_locked: false })
      .eq('match_id', matchId)

    // Get affected pools and recalculate leaderboard
    const { data: poolRows } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)

    const distinctPools = [...new Set((poolRows ?? []).map(p => p.pool_id))]
    for (const poolId of distinctPools) {
      const { error: lbErr } = await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
      if (lbErr) return { error: `Leaderboard error: ${lbErr.message}` }
    }
  }

  if (isNowFinished) {
    // Score all predictions for this match
    const { error: scoreErr } = await admin.rpc('score_match_predictions', { p_match_id: matchId })
    if (scoreErr) return { error: `Score error: ${scoreErr.message}` }

    const { data: poolRows } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)

    const distinctPools = [...new Set((poolRows ?? []).map(p => p.pool_id))]
    for (const poolId of distinctPools) {
      const { error: lbErr } = await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
      if (lbErr) return { error: `Leaderboard error: ${lbErr.message}` }
    }
  }

  return { success: true }
}

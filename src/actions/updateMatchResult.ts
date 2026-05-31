'use server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { matchResultSchema } from '@/lib/validations/match'

export async function updateMatchResult(matchId: string, data: unknown) {
  const parsed = matchResultSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['super_admin', 'pool_admin'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const admin = await createAdminClient()

  // Call the atomic SQL function — handles scoring, revert, and leaderboard
  // in a single transaction with SECURITY DEFINER (bypasses RLS).
  const { data: result, error } = await admin.rpc('admin_update_match_result', {
    p_match_id:   matchId,
    p_status:     parsed.data.status,
    p_home_goals: parsed.data.home_goals ?? null,
    p_away_goals: parsed.data.away_goals ?? null,
  })

  if (error) {
    // admin_update_match_result function not yet deployed — fall back to direct updates
    return await fallbackUpdateMatchResult(admin, matchId, parsed.data)
  }

  if (result?.error) return { error: result.error as string }

  return { success: true }
}

// Fallback for when the SQL function hasn't been deployed yet.
// Run fix-leaderboard-ambiguity.sql in Supabase Dashboard to enable the primary path.
async function fallbackUpdateMatchResult(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  matchId: string,
  data: { status: string; home_goals: number; away_goals: number }
) {
  const { data: current } = await admin
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  const wasFinished = current?.status === 'finished'
  const isReverting = wasFinished && data.status !== 'finished'

  if (isReverting) {
    // Get pools BEFORE resetting predictions
    const { data: poolRows } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)
    const distinctPools = [...new Set((poolRows ?? []).map(p => p.pool_id))]

    // Reset predictions
    await admin
      .from('predictions')
      .update({ points_earned: null, scored_at: null, is_locked: false })
      .eq('match_id', matchId)

    // Revert match — clear goals
    const { error: matchError } = await admin
      .from('matches')
      .update({ status: data.status, home_goals: null, away_goals: null })
      .eq('id', matchId)
    if (matchError && !matchError.message.includes('ambiguous')) {
      return { error: matchError.message }
    }

    // Recalculate leaderboard
    for (const poolId of distinctPools) {
      await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
    }
    return { success: true }
  }

  // Normal update
  const { error: matchError } = await admin
    .from('matches')
    .update(data)
    .eq('id', matchId)
  if (matchError && !matchError.message.includes('ambiguous')) {
    return { error: matchError.message }
  }

  if (data.status === 'finished') {
    await admin.rpc('score_match_predictions', { p_match_id: matchId })

    const { data: poolRows } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)
    const distinctPools = [...new Set((poolRows ?? []).map(p => p.pool_id))]
    for (const poolId of distinctPools) {
      await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
    }
  }

  return { success: true }
}

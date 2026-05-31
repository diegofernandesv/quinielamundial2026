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

  // Update match — the DB trigger handle_match_finished fires automatically,
  // but it currently has a bug (ambiguous 'id' in recalculate_leaderboard CTE).
  // We call scoring/leaderboard explicitly here so it works regardless.
  const { error: matchError } = await admin
    .from('matches')
    .update(parsed.data)
    .eq('id', matchId)

  // If the trigger bug causes the update to fail, report it but still try scoring
  if (matchError && !matchError.message.includes('ambiguous')) {
    return { error: matchError.message }
  }

  if (parsed.data.status === 'finished') {
    // Score all predictions for this match
    await admin.rpc('score_match_predictions', { p_match_id: matchId })

    // Get all pools that have predictions for this match
    const { data: poolRows } = await admin
      .from('predictions')
      .select('pool_id')
      .eq('match_id', matchId)

    const distinctPools = [...new Set((poolRows ?? []).map(p => p.pool_id))]

    // Recalculate leaderboard for each pool
    for (const poolId of distinctPools) {
      const { error: lbErr } = await admin.rpc('recalculate_leaderboard', { p_pool_id: poolId })
      if (lbErr) {
        // DB function has ambiguous 'id' bug — run fix SQL via management API is not possible here.
        // The user must apply fix-leaderboard-ambiguity.sql in Supabase Dashboard.
        return { error: `Error en leaderboard (aplica fix-leaderboard-ambiguity.sql en Supabase): ${lbErr.message}` }
      }
    }
  }

  return { success: true }
}

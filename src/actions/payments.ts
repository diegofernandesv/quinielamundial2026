"use server"
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Toggle has_paid for a pool member */
export async function toggleMemberPayment(
  poolId: string,
  memberId: string, // pool_members.id
  hasPaid: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify caller is pool owner
  const { data: pool } = await supabase
    .from('pools')
    .select('owner_id')
    .eq('id', poolId)
    .single()
  if (pool?.owner_id !== user.id) return { error: 'Sin permiso' }

  const { error } = await supabase
    .from('pool_members')
    .update({
      has_paid: hasPaid,
      paid_at: hasPaid ? new Date().toISOString() : null,
    })
    .eq('id', memberId)
    .eq('pool_id', poolId)

  if (error) return { error: error.message }
  revalidatePath(`/pools/${poolId}/payments`)
  return {}
}

export interface PrizeTier {
  position: number
  label: string
  percentage: number
}

/** Save entry fee and prize distribution for a pool */
export async function savePoolPaymentSettings(
  poolId: string,
  entryFee: number | null,
  prizeDistribution: PrizeTier[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: pool } = await supabase
    .from('pools')
    .select('owner_id')
    .eq('id', poolId)
    .single()
  if (pool?.owner_id !== user.id) return { error: 'Sin permiso' }

  // Validate percentages sum to 100 (if any tiers defined)
  if (prizeDistribution.length > 0) {
    const total = prizeDistribution.reduce((s, t) => s + t.percentage, 0)
    if (Math.abs(total - 100) > 0.01) return { error: 'Los porcentajes deben sumar 100%' }
  }

  const { error } = await supabase
    .from('pools')
    .update({
      entry_fee: entryFee,
      prize_distribution: prizeDistribution,
    })
    .eq('id', poolId)

  if (error) return { error: error.message }
  revalidatePath(`/pools/${poolId}/payments`)
  return {}
}

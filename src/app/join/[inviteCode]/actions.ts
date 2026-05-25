"use server"

import { createAdminClient, createClient } from '@/lib/supabase/server'

interface JoinByInviteResult {
  error?: string
  poolId?: string
  poolName?: string
  alreadyMember?: boolean
}

export async function joinPoolByInviteCode(inviteCode: string): Promise<JoinByInviteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debes iniciar sesión para unirte a una quiniela.' }
  }

  const admin = await createAdminClient()
  const normalizedCode = inviteCode.trim().toUpperCase()

  const { data: pool } = await admin
    .from('pools')
    .select('id, name, is_active, join_deadline, max_members')
    .eq('invite_code', normalizedCode)
    .single()

  if (!pool) {
    return { error: 'Este código de invitación no existe.' }
  }

  if (!pool.is_active) {
    return { error: 'Esta quiniela ya no está disponible.' }
  }

  if (pool.join_deadline && new Date(pool.join_deadline).getTime() < Date.now()) {
    return { error: 'La fecha límite para unirse a esta quiniela ya pasó.' }
  }

  const { data: existingMember } = await admin
    .from('pool_members')
    .select('id, is_active')
    .eq('pool_id', pool.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember?.is_active) {
    return { poolId: pool.id, poolName: pool.name, alreadyMember: true }
  }

  const { count: activeMembers } = await admin
    .from('pool_members')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', pool.id)
    .eq('is_active', true)

  if (pool.max_members && (activeMembers ?? 0) >= pool.max_members) {
    return { error: 'Esta quiniela ya alcanzó el máximo de participantes.' }
  }

  if (existingMember) {
    const { error } = await admin
      .from('pool_members')
      .update({ is_active: true, joined_at: new Date().toISOString() })
      .eq('id', existingMember.id)

    if (error) {
      return { error: error.message }
    }

    return { poolId: pool.id, poolName: pool.name }
  }

  const { error } = await admin
    .from('pool_members')
    .insert({ pool_id: pool.id, user_id: user.id })

  if (error) {
    return { error: error.message }
  }

  return { poolId: pool.id, poolName: pool.name }
}

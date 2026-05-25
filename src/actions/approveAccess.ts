"use server"
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveAccessRequest(requestId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify caller is super_admin
  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (caller?.role !== 'super_admin') return { error: 'Sin permiso' }

  // Load the request
  const { data: request, error: fetchErr } = await supabase
    .from('pool_access_requests')
    .select('user_id, status')
    .eq('id', requestId)
    .single()
  if (fetchErr || !request) return { error: 'Solicitud no encontrada' }
  if (request.status !== 'pending') return { error: 'Esta solicitud ya fue procesada' }

  // Promote the user — requires service-role key to bypass RLS on profiles
  const admin = await createAdminClient()
  const { error: updateErr } = await admin
    .from('profiles')
    .update({ role: 'pool_admin' })
    .eq('id', request.user_id)
  if (updateErr) return { error: updateErr.message }

  // Mark request as approved
  await supabase
    .from('pool_access_requests')
    .update({ status: 'approved', reviewed_by: user.id })
    .eq('id', requestId)

  revalidatePath('/admin/access-requests')
  return {}
}

export async function rejectAccessRequest(requestId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (caller?.role !== 'super_admin') return { error: 'Sin permiso' }

  const { error } = await supabase
    .from('pool_access_requests')
    .update({ status: 'rejected', reviewed_by: user.id })
    .eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/access-requests')
  return {}
}

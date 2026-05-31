'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getCallerRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role ?? null
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const role = await getCallerRole()
  if (role !== 'super_admin') return { error: 'Sin permiso' }

  const admin = await createAdminClient()

  // Remove from all pools first (cascade handles profiles but not auth.users)
  await admin.from('pool_members').delete().eq('user_id', userId)
  await admin.from('predictions').delete().eq('user_id', userId)

  // Delete from auth — cascades to profiles
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

export async function updateUserRole(userId: string, newRole: string): Promise<{ error?: string }> {
  const role = await getCallerRole()
  if (role !== 'super_admin') return { error: 'Sin permiso' }

  const admin = await createAdminClient()
  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

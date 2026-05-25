"use server"
import { createClient, createAdminClient } from '@/lib/supabase/server'

/* Called after admin registers — uses service-role to work before session exists */
export async function registerAdminRequest(
  userId: string,
  _displayName: string,
  _email: string,
  message: string = ''
): Promise<{ error?: string }> {
  const admin = await createAdminClient()

  await admin.from('profiles').update({ role: 'pending_admin' }).eq('id', userId)

  await admin.from('pool_access_requests').insert({
    user_id: userId,
    message: message.trim() || 'Cuenta de administrador solicitada en el registro.',
  })

  return {}
}

/* Called from the "Solicitar acceso" dialog (user already logged in) */
export async function requestPoolAccess(message: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('profiles').update({ role: 'pending_admin' }).eq('id', user.id)

  await supabase.from('pool_access_requests').insert({
    user_id: user.id,
    message: message.trim(),
  })

  return {}
}

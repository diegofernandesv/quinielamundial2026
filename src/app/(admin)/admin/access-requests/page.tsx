import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccessRequestsClient } from './AccessRequestsClient'

export const metadata = { title: 'Solicitudes de Acceso' }

export default async function AccessRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: requests } = await supabase
    .from('pool_access_requests')
    .select(`
      id, message, status, created_at,
      user:profiles!pool_access_requests_user_id_fkey(
        id, full_name, nickname, email, avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solicitudes de acceso</h1>
        <p className="text-muted-foreground mt-1">
          Usuarios que quieren crear quinielas
        </p>
      </div>
      <AccessRequestsClient requests={(requests as any[]) ?? []} />
    </div>
  )
}

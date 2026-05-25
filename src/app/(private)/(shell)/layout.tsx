import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import type { Profile } from '@/types/database'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  let pendingRequests = 0
  if (profile.role === 'super_admin') {
    const { count } = await supabase
      .from('pool_access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingRequests = count ?? 0
  }

  return (
    <AppShell profile={profile as Profile} pendingRequests={pendingRequests}>
      {children}
    </AppShell>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewPoolForm } from '@/components/pools/NewPoolForm'

export default async function NewPoolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'pool_admin') redirect('/pools')

  return <NewPoolForm />
}

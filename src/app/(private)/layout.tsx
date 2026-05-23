import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Auth guard only - AppShell is provided by nested layouts
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}

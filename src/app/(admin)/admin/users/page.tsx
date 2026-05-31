import { createAdminClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export default async function AdminUsersPage() {
  const admin = await createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select(`
      id, full_name, nickname, email, role, created_at,
      pool_members(pool_id, pools(id, name))
    `)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (profiles ?? []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground mt-1">{users.length} usuarios registrados</p>
      </div>
      <UsersClient users={users} />
    </div>
  )
}

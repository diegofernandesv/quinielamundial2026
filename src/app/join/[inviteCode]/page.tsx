import { JoinPageClient } from './JoinPageClient'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export default async function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params
  const admin = await createAdminClient()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const normalizedCode = inviteCode.toUpperCase()

  const { data: pool } = await admin
    .from('pools')
    .select('id, name, description, welcome_message, primary_color, owner:profiles(full_name, nickname)')
    .eq('invite_code', normalizedCode)
    .maybeSingle()

  const { data: membership } =
    user && pool
      ? await admin
          .from('pool_members')
          .select('id')
          .eq('pool_id', pool.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()
      : { data: null }

  return (
    <JoinPageClient
      inviteCode={normalizedCode}
      pool={
        pool
          ? {
              id: pool.id,
              name: pool.name,
              description: pool.description,
              welcome_message: pool.welcome_message,
              primary_color: pool.primary_color ?? '#0f172a',
              ownerName: (pool.owner as { nickname?: string | null; full_name?: string | null } | null)?.nickname
                ?? (pool.owner as { full_name?: string | null } | null)?.full_name
                ?? null,
            }
          : null
      }
      isAuthenticated={!!user}
      alreadyMember={!!membership}
    />
  )
}

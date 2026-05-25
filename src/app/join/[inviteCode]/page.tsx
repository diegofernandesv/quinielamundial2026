"use client"
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2Icon, TrophyIcon, UsersIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Pool } from '@/types/database'

export default function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params)
  const router = useRouter()
  const [pool, setPool] = useState<Pool | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: poolData } = await supabase
        .from('pools')
        .select('*, owner:profiles(full_name, nickname)')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (!poolData) { setLoading(false); return }
      setPool(poolData as Pool)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await supabase
          .from('pool_members')
          .select('id')
          .eq('pool_id', poolData.id)
          .eq('user_id', user.id)
          .single()
        if (membership) setAlreadyMember(true)
      }
      setLoading(false)
    }
    load()
  }, [inviteCode])

  async function join() {
    setJoining(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?next=/join/${inviteCode}`); return }
    if (!pool) return

    const { error } = await supabase
      .from('pool_members')
      .insert({ pool_id: pool.id, user_id: user.id })

    setJoining(false)
    if (error) { toast.error(error.message); return }
    toast.success(`¡Te uniste a ${pool.name}!`)
    router.push(`/pools/${pool.id}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (!pool) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold mb-2">Código inválido</p>
          <p className="text-muted-foreground text-sm">Este enlace de invitación no existe o ha expirado.</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard')}>Ir al dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl text-4xl"
            style={{ backgroundColor: (pool.primary_color ?? '#0f172a') + '20' }}>
            🏆
          </div>
          <CardTitle className="text-xl">{pool.name}</CardTitle>
          <CardDescription>
            {pool.description ?? 'Quiniela del Mundial 2026'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pool.welcome_message && (
            <div className="rounded-lg bg-muted p-3 text-sm italic text-muted-foreground">
              💬 {pool.welcome_message}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Creada por <span className="font-medium">{(pool.owner as any)?.nickname ?? (pool.owner as any)?.full_name}</span>
          </div>

          {alreadyMember ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">Ya eres miembro de esta quiniela</p>
              <Button className="w-full" onClick={() => router.push(`/pools/${pool.id}`)}>
                Ver quiniela
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={join} disabled={joining} size="lg">
              {joining ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <UsersIcon className="mr-2 size-4" />}
              Unirme a esta quiniela
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

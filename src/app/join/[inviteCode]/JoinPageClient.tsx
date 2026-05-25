"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2Icon, UsersIcon } from 'lucide-react'
import { joinPoolByInviteCode } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface JoinPageClientProps {
  inviteCode: string
  pool: {
    id: string
    name: string
    description: string | null
    welcome_message: string | null
    primary_color: string
    ownerName: string | null
  } | null
  isAuthenticated: boolean
  alreadyMember: boolean
}

export function JoinPageClient({
  inviteCode,
  pool,
  isAuthenticated,
  alreadyMember,
}: JoinPageClientProps) {
  const router = useRouter()
  const [joining, startJoining] = useTransition()
  const [isMember, setIsMember] = useState(alreadyMember)

  function join() {
    if (!isAuthenticated) {
      router.push(`/login?next=/join/${inviteCode}`)
      return
    }
    if (!pool) return

    startJoining(async () => {
      const result = await joinPoolByInviteCode(inviteCode)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setIsMember(true)
      toast.success(
        result.alreadyMember
          ? `Ya perteneces a ${result.poolName}`
          : `¡Te uniste a ${result.poolName}!`
      )
      router.push(`/pools/${result.poolId}`)
      router.refresh()
    })
  }

  if (!pool) {
    return (
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-3">
          <div
            className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl text-4xl"
            style={{ backgroundColor: (pool.primary_color ?? '#0f172a') + '20' }}
          >
            🏆
          </div>
          <CardTitle className="text-xl">{pool.name}</CardTitle>
          <CardDescription>{pool.description ?? 'Quiniela del Mundial 2026'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pool.welcome_message && (
            <div className="rounded-lg bg-muted p-3 text-sm italic text-muted-foreground">
              💬 {pool.welcome_message}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Creada por <span className="font-medium">{pool.ownerName ?? 'Administrador'}</span>
          </div>

          {isMember ? (
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

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2Icon, Loader2Icon, ShieldIcon, UserIcon, TrophyIcon } from 'lucide-react'
import { deleteUser } from '@/actions/adminUsers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Pool = { id: string; name: string }
type PoolMember = { pool_id: string; pools: Pool | null }
type UserProfile = {
  id: string
  full_name: string | null
  nickname: string | null
  email: string | null
  role: string
  created_at: string
  pool_members: PoolMember[]
}

const roleConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: typeof ShieldIcon }> = {
  super_admin:   { label: 'Super Admin',     variant: 'destructive', icon: ShieldIcon },
  pool_admin:    { label: 'Admin',           variant: 'success',     icon: ShieldIcon },
  pending_admin: { label: 'Admin pendiente', variant: 'warning',     icon: ShieldIcon },
  player:        { label: 'Jugador',         variant: 'secondary',   icon: UserIcon   },
  user:          { label: 'Usuario',         variant: 'secondary',   icon: UserIcon   },
}

export function UsersClient({ users }: { users: UserProfile[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(userId: string) {
    setConfirmId(null)
    setDeleting(userId)
    const { error } = await deleteUser(userId)
    setDeleting(null)
    if (error) { toast.error(error); return }
    toast.success('Usuario eliminado')
    router.refresh()
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <UserIcon className="size-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sin usuarios</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {users.map(user => {
        const displayName = user.nickname ?? user.full_name ?? 'Usuario'
        const initials = displayName.slice(0, 2).toUpperCase()
        const roleCfg = roleConfig[user.role] ?? { label: user.role, variant: 'secondary' as const, icon: UserIcon }
        const RoleIcon = roleCfg.icon
        const pools = user.pool_members
          .map(pm => pm.pools)
          .filter(Boolean) as Pool[]
        const isSuperAdmin = user.role === 'super_admin'

        return (
          <Card key={user.id}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              {/* Avatar + info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar className="size-10 shrink-0 mt-0.5">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{displayName}</p>
                    <Badge variant={roleCfg.variant} className="text-xs gap-1">
                      <RoleIcon className="size-3" />
                      {roleCfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>

                  {/* Pools */}
                  {pools.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TrophyIcon className="size-3 text-muted-foreground shrink-0" />
                      {pools.map(pool => (
                        <Badge key={pool.id} variant="outline" className="text-xs font-normal">
                          {pool.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin quinielas</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Registrado {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>

              {/* Delete — disabled for super_admin */}
              {!isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deleting === user.id}
                  onClick={() => setConfirmId(user.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 shrink-0"
                >
                  {deleting === user.id
                    ? <Loader2Icon className="size-4 animate-spin" />
                    : <Trash2Icon className="size-4" />
                  }
                  <span className="ml-1.5">Eliminar</span>
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Confirm delete dialog */}
      {(() => {
        const target = confirmId ? users.find(u => u.id === confirmId) : null
        const targetName = target ? (target.nickname ?? target.full_name ?? 'este usuario') : ''
        return (
          <Dialog open={!!confirmId} onOpenChange={open => !open && setConfirmId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar a {targetName}?</DialogTitle>
                <DialogDescription>
                  Esto eliminará su cuenta, predicciones y lo sacará de todas las quinielas. Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConfirmId(null)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmId && handleDelete(confirmId)}
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}

"use client"
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckIcon, XIcon, Loader2Icon, UserIcon } from 'lucide-react'
import { approveAccessRequest, rejectAccessRequest } from '@/actions/approveAccess'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Request {
  id: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user: {
    id: string
    full_name: string | null
    nickname: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

const statusConfig = {
  pending:  { label: 'Pendiente', variant: 'warning'  as const },
  approved: { label: 'Aprobado',  variant: 'success'  as const },
  rejected: { label: 'Rechazado', variant: 'secondary' as const },
}

export function AccessRequestsClient({ requests }: { requests: Request[] }) {
  const [loading, setLoading] = useState<Record<string, 'approve' | 'reject' | null>>({})

  async function handleApprove(id: string) {
    setLoading(prev => ({ ...prev, [id]: 'approve' }))
    const { error } = await approveAccessRequest(id)
    setLoading(prev => ({ ...prev, [id]: null }))
    if (error) { toast.error(error); return }
    toast.success('Usuario aprobado — ya puede crear quinielas')
  }

  async function handleReject(id: string) {
    setLoading(prev => ({ ...prev, [id]: 'reject' }))
    const { error } = await rejectAccessRequest(id)
    setLoading(prev => ({ ...prev, [id]: null }))
    if (error) { toast.error(error); return }
    toast.success('Solicitud rechazada')
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <UserIcon className="size-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sin solicitudes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aquí aparecerán los usuarios que soliciten acceso para crear quinielas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pendientes · {pending.length}
          </h2>
          {pending.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              loadingState={loading[req.id] ?? null}
              onApprove={() => handleApprove(req.id)}
              onReject={() => handleReject(req.id)}
            />
          ))}
        </section>
      )}

      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Revisadas · {reviewed.length}
          </h2>
          {reviewed.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              loadingState={null}
              onApprove={() => {}}
              onReject={() => {}}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function RequestCard({
  req,
  loadingState,
  onApprove,
  onReject,
}: {
  req: Request
  loadingState: 'approve' | 'reject' | null
  onApprove: () => void
  onReject: () => void
}) {
  const displayName = req.user?.nickname ?? req.user?.full_name ?? 'Usuario'
  const initials = displayName.slice(0, 2).toUpperCase()
  const cfg = statusConfig[req.status]

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="size-10 shrink-0">
            {req.user?.avatar_url && <AvatarImage src={req.user.avatar_url} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{displayName}</p>
              <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{req.user?.email}</p>
            {req.message && (
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                "{req.message}"
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>

        {/* Actions — only for pending */}
        {req.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={!!loadingState}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              {loadingState === 'reject'
                ? <Loader2Icon className="size-4 animate-spin" />
                : <XIcon className="size-4" />
              }
              <span className="ml-1.5">Rechazar</span>
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={!!loadingState}
            >
              {loadingState === 'approve'
                ? <Loader2Icon className="size-4 animate-spin" />
                : <CheckIcon className="size-4" />
              }
              <span className="ml-1.5">Aprobar</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

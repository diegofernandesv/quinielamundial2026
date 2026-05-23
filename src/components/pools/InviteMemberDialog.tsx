"use client"
import { useState } from 'react'
import { Copy, CheckIcon, LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  poolName: string
  inviteCode: string
}

export function InviteMemberDialog({ open, onOpenChange, poolName, inviteCode }: InviteMemberDialogProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar a {poolName}</DialogTitle>
          <DialogDescription>
            Comparte este enlace o código para que otros se unan a tu quiniela.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1.5">Enlace de invitación</p>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <CheckIcon className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1.5">Código de invitación</p>
            <div className="flex items-center gap-3 rounded-lg border bg-muted px-4 py-3">
              <LinkIcon className="size-4 text-muted-foreground" />
              <code className="text-xl font-bold tracking-[0.3em] flex-1 text-center">{inviteCode}</code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

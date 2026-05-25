"use client"
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2Icon, LockIcon, SendIcon } from 'lucide-react'
import { requestPoolAccess } from '@/actions/requestAccess'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

interface RequestAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await requestPoolAccess(message)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    setSent(true)
  }

  function handleClose(open: boolean) {
    if (!open) {
      // Reset state after close animation
      setTimeout(() => { setMessage(''); setSent(false) }, 300)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <SendIcon className="size-6 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle>Solicitud enviada</DialogTitle>
              <DialogDescription>
                El administrador revisará tu solicitud y te dará acceso pronto.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-1">
                <LockIcon className="size-5 text-muted-foreground" />
              </div>
              <DialogTitle>Solicitar acceso</DialogTitle>
              <DialogDescription>
                La creación de quinielas requiere aprobación del administrador.
                Envía tu solicitud y recibirás acceso en breve.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="access-message">
                ¿Por qué quieres crear una quiniela? <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Textarea
                id="access-message"
                placeholder="Ej: Quiero organizar una quiniela para mi grupo de amigos del trabajo..."
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? <><Loader2Icon className="mr-2 size-4 animate-spin" />Enviando...</>
                  : <><SendIcon className="mr-2 size-4" />Enviar solicitud</>
                }
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

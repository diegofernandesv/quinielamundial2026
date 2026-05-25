"use client"
import { useState } from 'react'
import Link from 'next/link'
import { PlusIcon, LockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequestAccessDialog } from './RequestAccessDialog'

export function PoolsActionButton({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  if (isAdmin) {
    return (
      <Button asChild size="sm">
        <Link href="/pools/new">
          <PlusIcon className="mr-1.5 size-4" />
          Nueva quiniela
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <LockIcon className="mr-1.5 size-4" />
        Solicitar acceso
      </Button>
      <RequestAccessDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

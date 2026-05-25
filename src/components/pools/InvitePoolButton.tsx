"use client"

import { useState } from 'react'
import { Share2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteMemberDialog } from '@/components/pools/InviteMemberDialog'

interface InvitePoolButtonProps {
  poolName: string
  inviteCode: string
  className?: string
}

export function InvitePoolButton({ poolName, inviteCode, className }: InvitePoolButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <Share2Icon className="mr-1.5 size-3.5" /> Invitar
      </Button>
      <InviteMemberDialog
        open={open}
        onOpenChange={setOpen}
        poolName={poolName}
        inviteCode={inviteCode}
      />
    </>
  )
}

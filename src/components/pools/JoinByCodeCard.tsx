"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface JoinByCodeCardProps {
  title?: string
  description?: string
}

export function JoinByCodeCard({
  title = 'Unirse con código',
  description = 'Ingresa el código de invitación para entrar a una quiniela.',
}: JoinByCodeCardProps) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')

  function joinWithCode() {
    const normalizedCode = inviteCode.trim().toUpperCase()
    if (!normalizedCode) return
    router.push(`/join/${normalizedCode}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TicketIcon className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                joinWithCode()
              }
            }}
            placeholder="Ej: ABCD1234"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono uppercase"
            maxLength={16}
          />
          <Button onClick={joinWithCode} disabled={!inviteCode.trim()}>
            Unirme
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

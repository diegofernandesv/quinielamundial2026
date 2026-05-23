"use client"
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LockIcon, GlobeIcon, UsersIcon, CalendarIcon, TrophyIcon } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Pool } from '@/types/database'

interface PoolCardProps {
  pool: Pool & { member_count?: number; user_is_member?: boolean }
}

export function PoolCard({ pool }: PoolCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex size-12 items-center justify-center rounded-xl text-2xl shrink-0"
            style={{ backgroundColor: pool.primary_color + '20' }}>
            {pool.logo_url
              ? <img src={pool.logo_url} alt="" className="size-10 rounded-lg object-cover" />
              : <TrophyIcon className="size-6" style={{ color: pool.primary_color }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold truncate">{pool.name}</h3>
              <Badge variant={pool.privacy === 'public' ? 'info' : 'secondary'} className="shrink-0">
                {pool.privacy === 'public' ? <GlobeIcon className="size-3 mr-1" /> : <LockIcon className="size-3 mr-1" />}
                {pool.privacy === 'public' ? 'Pública' : 'Privada'}
              </Badge>
            </div>
            {pool.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{pool.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {pool.member_count ?? 0}
            {pool.max_members && ` / ${pool.max_members}`} participantes
          </span>
          {pool.join_deadline && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              Cierra {format(new Date(pool.join_deadline), 'd MMM', { locale: es })}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0">
        <Button asChild className="w-full" size="sm">
          <Link href={`/pools/${pool.id}`}>
            Ver quiniela
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

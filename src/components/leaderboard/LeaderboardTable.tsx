"use client"
import { useState } from 'react'
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, DownloadIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserPredictionsSheet } from './UserPredictionsSheet'
import { downloadCSV, leaderboardToCSV } from '@/lib/utils/csv'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/database'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  poolName?: string
  poolId: string
}

const medalColors: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  2: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  3: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400',
}

export function LeaderboardTable({ entries, currentUserId, poolName, poolId }: LeaderboardTableProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null)

  const filtered = entries.filter(e => {
    const name = (e.profile?.nickname ?? e.profile?.full_name ?? '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  function handleExport() {
    const csv = leaderboardToCSV(entries)
    downloadCSV(csv, `leaderboard-${poolName ?? 'quiniela'}.csv`)
  }

  if (entries.length === 0) {
    return <EmptyState title="Sin participantes aún" description="El leaderboard aparecerá cuando haya predicciones calificadas." />
  }

  return (
    <div className="space-y-4">
      <UserPredictionsSheet
        entry={selected}
        poolId={poolId}
        onClose={() => setSelected(null)}
      />
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar participante..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
          <DownloadIcon className="size-3.5 mr-1.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead className="text-center w-20">Puntos</TableHead>
              <TableHead className="hidden sm:table-cell text-center w-20">Exactos</TableHead>
              <TableHead className="hidden md:table-cell text-center w-20">Correctos</TableHead>
              <TableHead className="hidden lg:table-cell text-center w-16">Bonus</TableHead>
              <TableHead className="hidden lg:table-cell text-center w-16">Pred.</TableHead>
              <TableHead className="w-10 text-center">↕</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => {
              const isCurrentUser = entry.user_id === currentUserId
              const trend = entry.previous_position !== null && entry.position !== null
                ? entry.previous_position - entry.position
                : null
              return (
                <TableRow
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className={cn(
                    "transition-colors cursor-pointer hover:bg-muted/60",
                    isCurrentUser && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <TableCell className="text-center">
                    <span className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold border",
                      medalColors[entry.position ?? 99] ?? "bg-muted text-muted-foreground border-transparent"
                    )}>
                      {entry.position ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        profile={entry.profile ?? { full_name: 'Usuario', nickname: null, avatar_url: null }}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-primary")}>
                          {entry.profile?.nickname ?? entry.profile?.full_name ?? 'Usuario'}
                          {isCurrentUser && <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-base">{entry.total_points}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Badge variant="success" className="text-xs">{entry.exact_scores}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className="text-sm">{entry.correct_results}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    <span className="text-sm text-muted-foreground">+{entry.bonus_points}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    <span className="text-sm text-muted-foreground">{entry.predictions_made}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {trend === null ? (
                      <MinusIcon className="size-4 text-muted-foreground mx-auto" />
                    ) : trend > 0 ? (
                      <TrendingUpIcon className="size-4 text-emerald-500 mx-auto" />
                    ) : trend < 0 ? (
                      <TrendingDownIcon className="size-4 text-red-500 mx-auto" />
                    ) : (
                      <MinusIcon className="size-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No se encontraron resultados para "{search}"
        </p>
      )}
    </div>
  )
}

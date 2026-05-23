import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GroupStanding, Team } from '@/types/database'

interface GroupStandingsTableProps {
  groupName: string
  standings: GroupStanding[]
}

export function GroupStandingsTable({ groupName, standings }: GroupStandingsTableProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-primary px-4 py-2">
        <h3 className="font-bold text-primary-foreground text-sm">Grupo {groupName}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-6 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Equipo</TableHead>
            <TableHead className="text-center text-xs w-8">PJ</TableHead>
            <TableHead className="text-center text-xs w-8">G</TableHead>
            <TableHead className="text-center text-xs w-8">E</TableHead>
            <TableHead className="text-center text-xs w-8">P</TableHead>
            <TableHead className="hidden sm:table-cell text-center text-xs w-12">GF:GC</TableHead>
            <TableHead className="text-center text-xs w-8">DG</TableHead>
            <TableHead className="text-center text-xs w-8 font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s, i) => (
            <TableRow key={s.team.id}
              className={cn(
                i < 2 && "bg-emerald-50/50 dark:bg-emerald-950/20",
                s.qualified === 'best_third' && "bg-amber-50/50 dark:bg-amber-950/20"
              )}
            >
              <TableCell className="text-center">
                <span className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold",
                  i === 0 && "bg-amber-400 text-amber-900",
                  i === 1 && "bg-emerald-500 text-white",
                  i >= 2 && "text-muted-foreground"
                )}>{i + 1}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{s.team.flag_emoji ?? '🏳'}</span>
                  <span className="text-sm font-medium">{s.team.short_name}</span>
                  {s.qualified === 'top2' && i < 2 && (
                    <Badge variant="success" className="text-[10px] px-1 py-0 ml-1">Clasifica</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center text-sm">{s.played}</TableCell>
              <TableCell className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">{s.won}</TableCell>
              <TableCell className="text-center text-sm">{s.drawn}</TableCell>
              <TableCell className="text-center text-sm text-red-500">{s.lost}</TableCell>
              <TableCell className="hidden sm:table-cell text-center text-xs text-muted-foreground">{s.goals_for}:{s.goals_against}</TableCell>
              <TableCell className="text-center text-sm">{s.goal_difference > 0 ? '+' : ''}{s.goal_difference}</TableCell>
              <TableCell className="text-center font-bold text-sm">{s.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

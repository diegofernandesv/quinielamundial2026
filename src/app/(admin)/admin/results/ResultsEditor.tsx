"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon, CheckCircle2Icon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { matchResultSchema, type MatchResultInput } from '@/lib/validations/match'
import { formatMatchDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/database'

const statusColors = {
  scheduled: 'secondary' as const,
  live: 'warning' as const,
  finished: 'success' as const,
}
const statusLabels = { scheduled: 'Programado', live: 'En vivo', finished: 'Finalizado' }

interface ResultsEditorProps { initialMatches: Match[] }

export function ResultsEditor({ initialMatches }: ResultsEditorProps) {
  const [matches, setMatches] = useState(initialMatches)
  const [editing, setEditing] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<MatchResultInput>({
    resolver: zodResolver(matchResultSchema) as any,
    defaultValues: { home_goals: 0, away_goals: 0, status: 'scheduled' },
  })

  function openEdit(match: Match) {
    form.reset({ home_goals: match.home_goals ?? 0, away_goals: match.away_goals ?? 0, status: match.status })
    setEditing(match)
  }

  async function onSubmit(data: MatchResultInput) {
    if (!editing) return
    setLoading(true)
    const { error } = await supabase.from('matches').update(data).eq('id', editing.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setMatches(m => m.map(mt => mt.id === editing.id ? { ...mt, ...data } : mt))
    toast.success('Resultado actualizado · Puntos recalculados automáticamente')
    setEditing(null)
  }

  const byStatus = {
    live: matches.filter(m => m.status === 'live'),
    scheduled: matches.filter(m => m.status === 'scheduled'),
    finished: matches.filter(m => m.status === 'finished'),
  }

  const MatchRow = ({ match }: { match: Match }) => (
    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {(match.home_team as any)?.flag_emoji} {(match.home_team as any)?.short_name} vs {(match.away_team as any)?.flag_emoji} {(match.away_team as any)?.short_name}
          </span>
          <Badge variant={statusColors[match.status]}>{statusLabels[match.status]}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatMatchDate(match.scheduled_at)}</span>
          {match.status === 'finished' && match.home_goals !== null && (
            <span className="text-xs font-bold text-foreground">{match.home_goals} - {match.away_goals}</span>
          )}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => openEdit(match)}>
        Actualizar
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Actualizar Resultados</h1>
        <p className="text-muted-foreground mt-1">Los puntos se recalculan automáticamente al marcar un partido como finalizado</p>
      </div>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">En vivo <span className="ml-1.5 text-xs opacity-60">{byStatus.live.length}</span></TabsTrigger>
          <TabsTrigger value="scheduled">Programados <span className="ml-1.5 text-xs opacity-60">{byStatus.scheduled.length}</span></TabsTrigger>
          <TabsTrigger value="finished">Finalizados <span className="ml-1.5 text-xs opacity-60">{byStatus.finished.length}</span></TabsTrigger>
        </TabsList>
        {(['live', 'scheduled', 'finished'] as const).map(status => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardContent className="p-4 space-y-2">
                {byStatus[status].length === 0
                  ? <p className="text-center text-sm text-muted-foreground py-8">Sin partidos en esta sección</p>
                  : byStatus[status].map(m => <MatchRow key={m.id} match={m} />)
                }
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing && `${(editing.home_team as any)?.name} vs ${(editing.away_team as any)?.name}`}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del partido</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Programado</SelectItem>
                        <SelectItem value="live">En vivo</SelectItem>
                        <SelectItem value="finished">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="home_goals" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(editing.home_team as any)?.name ?? 'Local'}</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="away_goals" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(editing.away_team as any)?.name ?? 'Visitante'}</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <CheckCircle2Icon className="mr-2 size-4" />}
                    Guardar resultado
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

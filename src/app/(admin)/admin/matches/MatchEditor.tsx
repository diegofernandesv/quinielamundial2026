"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlusIcon, Loader2Icon, PencilIcon, TrashIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { matchSchema, type MatchInput } from '@/lib/validations/match'
import { formatMatchDate } from '@/lib/utils/format'
import { PHASE_LABELS } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import type { Match, Team, TournamentGroup } from '@/types/database'

interface MatchEditorProps { initialMatches: Match[]; teams: Team[]; groups: TournamentGroup[] }

export function MatchEditor({ initialMatches, teams, groups }: MatchEditorProps) {
  const [matches, setMatches] = useState(initialMatches)
  const [editing, setEditing] = useState<Match | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<MatchInput>({
    resolver: zodResolver(matchSchema) as any,
    defaultValues: { phase: 'group', scheduled_at: '' },
  })

  function openNew() { form.reset({ phase: 'group', scheduled_at: '' }); setEditing(null); setDialogOpen(true) }
  function openEdit(match: Match) {
    form.reset({
      home_team_id: match.home_team_id ?? undefined,
      away_team_id: match.away_team_id ?? undefined,
      group_id: match.group_id ?? undefined,
      phase: match.phase,
      match_number: match.match_number ?? undefined,
      round_label: match.round_label ?? undefined,
      stadium: match.stadium ?? undefined,
      city: match.city ?? undefined,
      scheduled_at: match.scheduled_at.slice(0, 16),
    })
    setEditing(match); setDialogOpen(true)
  }

  async function onSubmit(data: MatchInput) {
    setLoading(true)
    if (editing) {
      const { error } = await supabase.from('matches').update(data).eq('id', editing.id)
      if (error) { toast.error(error.message); setLoading(false); return }
      setMatches(m => m.map(mt => mt.id === editing.id ? { ...mt, ...data } : mt))
    } else {
      const { data: newMatch, error } = await supabase.from('matches').insert(data).select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)').single()
      if (error) { toast.error(error.message); setLoading(false); return }
      setMatches(m => [...m, newMatch as Match])
    }
    setLoading(false); toast.success(editing ? 'Partido actualizado' : 'Partido creado'); setDialogOpen(false)
  }

  async function deleteMatch(id: string) {
    if (!confirm('¿Eliminar partido?')) return
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setMatches(m => m.filter(mt => mt.id !== id))
    toast.success('Partido eliminado')
  }

  const teamMap = new Map(teams.map(t => [t.id, t]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Partidos</h1><p className="text-muted-foreground">{matches.length} partidos cargados</p></div>
        <Button onClick={openNew} size="sm"><PlusIcon className="mr-1.5 size-4" />Agregar partido</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Partido</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="hidden md:table-cell">Fase</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map(match => {
                const home = teamMap.get(match.home_team_id ?? '') ?? (match.home_team as any)
                const away = teamMap.get(match.away_team_id ?? '') ?? (match.away_team as any)
                return (
                  <TableRow key={match.id}>
                    <TableCell className="text-xs text-muted-foreground">{match.match_number ?? '—'}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {home?.flag_emoji} {home?.name ?? 'Por definir'} vs {away?.flag_emoji} {away?.name ?? 'Por definir'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{formatMatchDate(match.scheduled_at)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{PHASE_LABELS.find(p => p.value === match.phase)?.short ?? match.phase}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={match.status === 'finished' ? 'success' : match.status === 'live' ? 'warning' : 'secondary'} className="text-xs">
                        {match.status === 'finished' ? 'Final' : match.status === 'live' ? 'En vivo' : 'Prog.'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(match)}><PencilIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteMatch(match.id)}><TrashIcon className="size-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar partido' : 'Nuevo partido'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="home_team_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo local</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="away_team_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo visitante</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phase" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{PHASE_LABELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="group_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger></FormControl>
                    <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="scheduled_at" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Fecha y hora *</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stadium" render={({ field }) => (
                <FormItem><FormLabel>Estadio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="match_number" render={({ field }) => (
                <FormItem><FormLabel>N° de partido</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="round_label" render={({ field }) => (
                <FormItem><FormLabel>Etiqueta (ej: QF1)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="col-span-2 flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}{editing ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

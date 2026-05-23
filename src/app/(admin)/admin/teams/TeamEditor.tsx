"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusIcon, Loader2Icon, PencilIcon, TrashIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Team, TournamentGroup } from '@/types/database'

const teamSchema = z.object({
  name: z.string().min(2),
  short_name: z.string().length(3, 'Exactamente 3 letras').toUpperCase(),
  flag_emoji: z.string().optional(),
  confederation: z.string().optional(),
  group_id: z.string().uuid().optional(),
})
type TeamInput = z.infer<typeof teamSchema>

interface TeamEditorProps {
  initialTeams: Team[]
  groups: (TournamentGroup & { group_teams: { team_id: string }[] })[]
}

export function TeamEditor({ initialTeams, groups }: TeamEditorProps) {
  const [teams, setTeams] = useState(initialTeams)
  const [editing, setEditing] = useState<Team | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<TeamInput>({
    resolver: zodResolver(teamSchema) as any,
    defaultValues: { name: '', short_name: '', flag_emoji: '', confederation: '' },
  })

  function openNew() { form.reset(); setEditing(null); setDialogOpen(true) }
  function openEdit(team: Team) {
    const group = groups.find(g => g.group_teams.some(gt => gt.team_id === team.id))
    form.reset({ name: team.name, short_name: team.short_name, flag_emoji: team.flag_emoji ?? '', confederation: team.confederation ?? '', group_id: group?.id })
    setEditing(team)
    setDialogOpen(true)
  }

  async function onSubmit(data: TeamInput) {
    setLoading(true)
    const { group_id, ...teamData } = data
    let teamId = editing?.id

    if (editing) {
      const { error } = await supabase.from('teams').update(teamData).eq('id', editing.id)
      if (error) { toast.error(error.message); setLoading(false); return }
      setTeams(t => t.map(tm => tm.id === editing.id ? { ...tm, ...teamData } : tm))
    } else {
      const { data: newTeam, error } = await supabase.from('teams').insert(teamData).select().single()
      if (error) { toast.error(error.message); setLoading(false); return }
      setTeams(t => [...t, newTeam as Team])
      teamId = newTeam.id
    }

    // Update group assignment
    if (group_id && teamId) {
      await supabase.from('group_teams').delete().eq('team_id', teamId)
      await supabase.from('group_teams').insert({ group_id, team_id: teamId })
    }

    setLoading(false)
    toast.success(editing ? 'Equipo actualizado' : 'Equipo creado')
    setDialogOpen(false)
  }

  async function deleteTeam(id: string) {
    if (!confirm('¿Eliminar este equipo?')) return
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setTeams(t => t.filter(tm => tm.id !== id))
    toast.success('Equipo eliminado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <p className="text-muted-foreground">{teams.length} / 48 equipos cargados</p>
        </div>
        <Button onClick={openNew} size="sm">
          <PlusIcon className="mr-1.5 size-4" /> Agregar equipo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bandera</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="hidden sm:table-cell">Confederación</TableHead>
                <TableHead className="hidden md:table-cell">Grupo</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => {
                const group = groups.find(g => g.group_teams.some(gt => gt.team_id === team.id))
                return (
                  <TableRow key={team.id}>
                    <TableCell className="text-xl">{team.flag_emoji ?? '🏳'}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{team.short_name}</code></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{team.confederation ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {group ? <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Grupo {group.name}</span> : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(team)}>
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteTeam(team.id)}>
                          <TrashIcon className="size-3.5 text-destructive" />
                        </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar equipo' : 'Nuevo equipo'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre oficial</FormLabel>
                    <FormControl><Input placeholder="Argentina" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="short_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código (3 letras)</FormLabel>
                    <FormControl><Input placeholder="ARG" maxLength={3} {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="flag_emoji" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji bandera</FormLabel>
                    <FormControl><Input placeholder="🇦🇷" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confederation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confederación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="group_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sin grupo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>Grupo {g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  {editing ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

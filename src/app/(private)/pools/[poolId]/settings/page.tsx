"use client"
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { SaveIcon, Loader2Icon, UsersIcon, TrashIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updatePoolSchema, scoringRulesSchema, type CreatePoolInput, type ScoringRulesInput } from '@/lib/validations/pool'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InviteMemberDialog } from '@/components/pools/InviteMemberDialog'
import { Separator } from '@/components/ui/separator'
import type { Pool, ScoringRules, PoolMember } from '@/types/database'

export default function PoolSettingsPage({ params }: { params: { poolId: string } }) {
  const poolId = params.poolId
  const [pool, setPool] = useState<Pool | null>(null)
  const [rules, setRules] = useState<ScoringRules | null>(null)
  const [members, setMembers] = useState<PoolMember[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const poolForm = useForm<Partial<CreatePoolInput>>({
    resolver: zodResolver(updatePoolSchema) as any,
    defaultValues: {},
  })
  const rulesForm = useForm<ScoringRulesInput>({ resolver: zodResolver(scoringRulesSchema) as any })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: poolData }, { data: rulesData }, { data: membersData }] = await Promise.all([
        supabase.from('pools').select('*').eq('id', poolId).single(),
        supabase.from('scoring_rules').select('*').eq('pool_id', poolId).single(),
        supabase.from('pool_members').select('*, profile:profiles(*)').eq('pool_id', poolId).eq('is_active', true),
      ])
      if (poolData) {
        setPool(poolData as Pool)
        setIsOwner(poolData.owner_id === user.id)
        poolForm.reset({
          name: poolData.name,
          description: poolData.description ?? '',
          privacy: poolData.privacy,
          welcome_message: poolData.welcome_message ?? '',
          max_members: poolData.max_members ?? undefined,
        })
      }
      if (rulesData) {
        setRules(rulesData as ScoringRules)
        rulesForm.reset({
          exact_score_points: rulesData.exact_score_points,
          correct_result_points: rulesData.correct_result_points,
          correct_draw_points: rulesData.correct_draw_points,
          goal_difference_bonus: rulesData.goal_difference_bonus,
          home_goals_bonus: rulesData.home_goals_bonus,
          away_goals_bonus: rulesData.away_goals_bonus,
          champion_bonus: rulesData.champion_bonus,
          runner_up_bonus: rulesData.runner_up_bonus,
          semifinalist_bonus: rulesData.semifinalist_bonus,
          enable_goal_difference_bonus: rulesData.enable_goal_difference_bonus,
          enable_team_goals_bonus: rulesData.enable_team_goals_bonus,
          enable_phase_multipliers: rulesData.enable_phase_multipliers,
          enable_bonus_predictions: rulesData.enable_bonus_predictions,
        })
      }
      setMembers((membersData ?? []) as PoolMember[])
    }
    load()
  }, [poolId])

  async function savePool(data: Partial<CreatePoolInput>) {
    setSaving(true)
    const { error } = await supabase.from('pools').update(data).eq('id', poolId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Quiniela actualizada')
  }

  async function saveRules(data: ScoringRulesInput) {
    setSaving(true)
    const { error } = await supabase.from('scoring_rules').update(data).eq('pool_id', poolId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Reglas actualizadas')
  }

  async function removeMember(userId: string) {
    if (!confirm('¿Expulsar a este participante?')) return
    const { error } = await supabase.from('pool_members').update({ is_active: false }).eq('pool_id', poolId).eq('user_id', userId)
    if (error) { toast.error(error.message); return }
    setMembers(m => m.filter(mb => mb.user_id !== userId))
    toast.success('Participante expulsado')
  }

  if (!isOwner) return <p className="text-muted-foreground">Solo el creador puede ver esta sección.</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
          Invitar miembros
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="members">Miembros</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información de la quiniela</CardTitle></CardHeader>
            <CardContent>
              <Form {...poolForm}>
                <form onSubmit={poolForm.handleSubmit(savePool)} className="space-y-4">
                  <FormField control={poolForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={poolForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={poolForm.control} name="privacy" render={({ field }) => (
                    <FormItem><FormLabel>Privacidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="private">Privada</SelectItem>
                          <SelectItem value="public">Pública</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={poolForm.control} name="welcome_message" render={({ field }) => (
                    <FormItem><FormLabel>Mensaje de bienvenida</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={saving} size="sm">
                    {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <SaveIcon className="mr-2 size-4" />}
                    Guardar
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sistema de puntuación</CardTitle>
              <CardDescription>Estos cambios solo aplican a partidos futuros</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...rulesForm}>
                <form onSubmit={rulesForm.handleSubmit(saveRules)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'exact_score_points' as const, label: 'Marcador exacto' },
                      { name: 'correct_result_points' as const, label: 'Resultado correcto' },
                      { name: 'correct_draw_points' as const, label: 'Empate correcto' },
                      { name: 'goal_difference_bonus' as const, label: 'Bono dif. goles' },
                      { name: 'home_goals_bonus' as const, label: 'Bono goles local' },
                      { name: 'away_goals_bonus' as const, label: 'Bono goles visita' },
                      { name: 'champion_bonus' as const, label: 'Bono campeón' },
                      { name: 'runner_up_bonus' as const, label: 'Bono subcampeón' },
                      { name: 'semifinalist_bonus' as const, label: 'Bono semifinalista' },
                    ].map(f => (
                      <FormField key={f.name} control={rulesForm.control} name={f.name} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{f.label}</FormLabel>
                          <FormControl><Input type="number" min={0} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ))}
                  </div>
                  <Separator />
                  {[
                    { name: 'enable_goal_difference_bonus' as const, label: 'Bono por diferencia de goles' },
                    { name: 'enable_team_goals_bonus' as const, label: 'Bono por goles exactos de equipo' },
                    { name: 'enable_phase_multipliers' as const, label: 'Multiplicadores por fase' },
                    { name: 'enable_bonus_predictions' as const, label: 'Predicciones bonus (campeón, etc.)' },
                  ].map(f => (
                    <FormField key={f.name} control={rulesForm.control} name={f.name} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-sm cursor-pointer">{f.label}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                  ))}
                  <Button type="submit" disabled={saving} size="sm">
                    {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <SaveIcon className="mr-2 size-4" />}
                    Guardar reglas
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersIcon className="size-4" /> Participantes ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map(member => {
                const profile = (member as any).profile
                return (
                  <div key={member.user_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{profile?.nickname ?? profile?.full_name ?? 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    {member.user_id !== pool?.owner_id && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeMember(member.user_id)}>
                        <TrashIcon className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pool && (
        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          poolName={pool.name}
          inviteCode={pool.invite_code}
        />
      )}
    </div>
  )
}

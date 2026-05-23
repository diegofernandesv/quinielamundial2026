"use client"
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { StarIcon, Loader2Icon, LockIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { bonusPredictionSchema, type BonusPredictionInput } from '@/lib/validations/prediction'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { isDeadlinePassed } from '@/lib/utils/format'
import type { Team, Pool, BonusPrediction } from '@/types/database'

export default function BonusPage({ params }: { params: { poolId: string } }) {
  const poolId = params.poolId
  const [teams, setTeams] = useState<Team[]>([])
  const [pool, setPool] = useState<Pool | null>(null)
  const [existing, setExisting] = useState<BonusPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<BonusPredictionInput>({
    resolver: zodResolver(bonusPredictionSchema),
    defaultValues: {},
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: teamsData }, { data: poolData }, { data: bonusData }] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('pools').select('*').eq('id', poolId).single(),
        supabase.from('bonus_predictions').select('*').eq('pool_id', poolId).eq('user_id', user.id).single(),
      ])
      setTeams((teamsData ?? []) as Team[])
      setPool(poolData as Pool)
      if (bonusData) {
        setExisting(bonusData as BonusPrediction)
        form.reset({
          champion_team_id: bonusData.champion_team_id ?? undefined,
          runner_up_team_id: bonusData.runner_up_team_id ?? undefined,
          semifinalist_1_id: bonusData.semifinalist_1_id ?? undefined,
          semifinalist_2_id: bonusData.semifinalist_2_id ?? undefined,
        })
      }
    }
    load()
  }, [poolId])

  const isLocked = existing?.is_locked || isDeadlinePassed(pool?.bonus_deadline)

  async function onSubmit(data: BonusPredictionInput) {
    if (isLocked) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const payload = { ...data, pool_id: poolId, user_id: user.id }
    const { error } = existing
      ? await supabase.from('bonus_predictions').update(data).eq('id', existing.id)
      : await supabase.from('bonus_predictions').insert(payload)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Predicciones bonus guardadas')
  }

  const TeamSelect = ({ name, label }: { name: keyof BonusPredictionInput; label: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLocked}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {teams.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">{t.flag_emoji} {t.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predicciones Bonus</h1>
          <p className="text-muted-foreground mt-1">Predice los finalistas para ganar puntos extra</p>
        </div>
        {isLocked && <Badge variant="secondary"><LockIcon className="size-3 mr-1" />Bloqueado</Badge>}
      </div>

      {isLocked && (
        <Alert>
          <AlertDescription>
            Las predicciones bonus están bloqueadas.
            {pool?.bonus_deadline && ` El plazo venció el ${new Date(pool.bonus_deadline).toLocaleDateString('es')}.`}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StarIcon className="size-4 text-amber-500" /> Campeón (+10 pts)
              </CardTitle>
              <CardDescription>¿Quién ganará el Mundial 2026?</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamSelect name="champion_team_id" label="Selecciona el campeón" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StarIcon className="size-4 text-slate-400" /> Subcampeón (+6 pts)
              </CardTitle>
              <CardDescription>¿Quién llegará a la final pero perderá?</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamSelect name="runner_up_team_id" label="Selecciona el subcampeón" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StarIcon className="size-4 text-orange-400" /> Semifinalistas (+4 pts cada uno)
              </CardTitle>
              <CardDescription>¿Qué equipos llegarán a las semifinales?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <TeamSelect name="semifinalist_1_id" label="Semifinalista 1" />
              <TeamSelect name="semifinalist_2_id" label="Semifinalista 2" />
            </CardContent>
          </Card>

          {!isLocked && (
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Guardar predicciones bonus
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}

"use client"
import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCwIcon, Loader2Icon, CheckCircle2Icon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RecalculatePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const supabase = createClient()

  async function recalculateAll() {
    setLoading('all')
    // Get all finished matches and recalculate
    const { data: pools } = await supabase.from('pools').select('id, name')
    if (!pools) { setLoading(null); return }

    let count = 0
    for (const pool of pools) {
      await supabase.rpc('recalculate_leaderboard', { p_pool_id: pool.id })
      count++
    }
    setLoading(null)
    setDone(d => [...d, 'all'])
    toast.success(`Leaderboard recalculado para ${count} quinielas`)
  }

  async function rescoreFinished() {
    setLoading('score')
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'finished')

    if (!matches) { setLoading(null); return }

    for (const match of matches) {
      await supabase.rpc('score_match_predictions', { p_match_id: match.id })
    }
    setLoading(null)
    setDone(d => [...d, 'score'])
    toast.success(`${matches.length} partidos re-calificados`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recalcular Puntos</h1>
        <p className="text-muted-foreground mt-1">Herramientas de recálculo manual para administradores</p>
      </div>

      <Alert>
        <AlertDescription>
          Los puntos se recalculan automáticamente cuando se actualiza un resultado. Usa estas herramientas solo si detectas inconsistencias.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recalificar predicciones</CardTitle>
            <CardDescription>Vuelve a calcular los puntos de todas las predicciones de partidos finalizados</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={rescoreFinished} disabled={!!loading} variant={done.includes('score') ? 'outline' : 'default'}>
              {loading === 'score' ? <Loader2Icon className="mr-2 size-4 animate-spin" /> :
               done.includes('score') ? <CheckCircle2Icon className="mr-2 size-4 text-emerald-500" /> :
               <RefreshCwIcon className="mr-2 size-4" />}
              {done.includes('score') ? 'Completado' : 'Recalificar predicciones'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recalcular leaderboards</CardTitle>
            <CardDescription>Actualiza las posiciones y puntos totales en todas las quinielas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={recalculateAll} disabled={!!loading} variant={done.includes('all') ? 'outline' : 'default'}>
              {loading === 'all' ? <Loader2Icon className="mr-2 size-4 animate-spin" /> :
               done.includes('all') ? <CheckCircle2Icon className="mr-2 size-4 text-emerald-500" /> :
               <RefreshCwIcon className="mr-2 size-4" />}
              {done.includes('all') ? 'Completado' : 'Recalcular todos los leaderboards'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

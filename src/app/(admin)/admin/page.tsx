import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/shared/StatsCards'
import { UsersIcon, TrophyIcon, CalendarIcon, BarChart3Icon, ShieldIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const adminLinks = [
  { href: '/admin/teams', icon: ShieldIcon, label: 'Equipos', desc: 'Agregar y editar las 48 selecciones' },
  { href: '/admin/matches', icon: CalendarIcon, label: 'Partidos', desc: 'Cargar calendario del torneo' },
  { href: '/admin/results', icon: BarChart3Icon, label: 'Resultados', desc: 'Actualizar marcadores reales' },
  { href: '/admin/users', icon: UsersIcon, label: 'Usuarios', desc: 'Gestionar roles y accesos' },
  { href: '/admin/recalculate', icon: TrophyIcon, label: 'Recalcular', desc: 'Recalcular puntos manualmente' },
]

export default async function AdminPage() {
  const supabase = await createClient()
  const [
    { count: teamsCount },
    { count: matchesCount },
    { count: usersCount },
    { count: poolsCount },
  ] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('pools').select('*', { count: 'exact', head: true }),
  ])

  const { count: finishedCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'finished')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Control total del Mundial 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Equipos" value={teamsCount ?? 0} icon={ShieldIcon} subtitle="de 48 totales" />
        <StatCard title="Partidos" value={matchesCount ?? 0} icon={CalendarIcon} subtitle={`${finishedCount ?? 0} finalizados`} />
        <StatCard title="Usuarios" value={usersCount ?? 0} icon={UsersIcon} subtitle="registrados" />
        <StatCard title="Quinielas" value={poolsCount ?? 0} icon={TrophyIcon} subtitle="activas" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {adminLinks.map(link => (
          <Link key={link.href} href={link.href}
            className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted hover:shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <link.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{link.label}</p>
              <p className="text-sm text-muted-foreground">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

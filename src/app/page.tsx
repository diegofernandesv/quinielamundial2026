import Link from 'next/link'
import {
  TrophyIcon,
  UsersIcon,
  BarChart3Icon,
  ShieldIcon,
  ArrowRightIcon,
  StarIcon,
  CalendarIcon,
  GlobeIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const features = [
  { icon: TrophyIcon, title: 'Quinielas privadas', desc: 'Crea tu propia quiniela e invita a tus amigos con un código único.' },
  { icon: BarChart3Icon, title: 'Leaderboard en tiempo real', desc: 'Tabla de posiciones actualizada automáticamente tras cada resultado.' },
  { icon: UsersIcon, title: 'Grupos y bracket', desc: 'Sigue la fase de grupos y el bracket eliminatorio del torneo.' },
  { icon: StarIcon, title: 'Predicciones bonus', desc: 'Predice el campeón, subcampeón y semifinalistas para puntos extra.' },
  { icon: ShieldIcon, title: 'Reglas personalizables', desc: 'Cada quiniela puede tener su propio sistema de puntuación.' },
]

const highlights = [
  { label: 'Selecciones', value: '48', icon: GlobeIcon },
  { label: 'Partidos', value: '104', icon: CalendarIcon },
  { label: 'Modo social', value: 'Privado', icon: UsersIcon },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TrophyIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Quiniela Mundial 2026</p>
              <p className="text-[11px] text-muted-foreground">Predicciones entre amigos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_24rem] lg:items-start">
          <div className="relative">
            <Badge variant="info" className="mb-5">Mundial 2026 · USA, México & Canadá</Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              La quiniela del <span className="text-primary">mundial más grande</span> de la historia
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              48 selecciones, 104 partidos y tus predicciones en una sola plataforma. Crea una quiniela, compártela con tu grupo y sigue cada jornada con una tabla que se mueve en tiempo real.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/register">
                  Regístrate <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Tu torneo, tu grupo</p>
                  <p className="mt-1 text-xs text-muted-foreground">Diseñado para quinielas privadas con seguimiento partido a partido.</p>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <TrophyIcon className="size-5" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <item.icon className="size-4" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-lg font-semibold tracking-tight">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Qué incluye</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Todo lo necesario para correr una quiniela seria</h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Mantén la organización simple, sigue el torneo completo y deja que el ranking haga el resto.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={[
                'rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-colors hover:bg-muted/30',
                index === 0 ? 'lg:col-span-2 lg:row-span-2' : '',
                index === 1 ? 'lg:col-span-2' : '',
                index === 2 ? 'lg:col-span-2' : '',
                index > 2 ? 'lg:col-span-2' : '',
              ].join(' ')}
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/80 py-6 text-center text-xs text-muted-foreground">
        © 2026 Quiniela Mundial · Hecho para grupos que se toman el fútbol en serio
      </footer>
    </div>
  )
}

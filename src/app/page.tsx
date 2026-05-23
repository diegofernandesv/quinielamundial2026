import Link from 'next/link'
import { TrophyIcon, UsersIcon, BarChart3Icon, ShieldIcon, ArrowRightIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const features = [
  { icon: TrophyIcon, title: 'Quinielas privadas', desc: 'Crea tu propia quiniela e invita a tus amigos con un código único.' },
  { icon: BarChart3Icon, title: 'Leaderboard en tiempo real', desc: 'Tabla de posiciones actualizada automáticamente tras cada resultado.' },
  { icon: UsersIcon, title: 'Grupos y bracket', desc: 'Sigue la fase de grupos y el bracket eliminatorio del torneo.' },
  { icon: StarIcon, title: 'Predicciones bonus', desc: 'Predice el campeón, subcampeón y semifinalistas para puntos extra.' },
  { icon: ShieldIcon, title: 'Reglas personalizables', desc: 'Cada quiniela puede tener su propio sistema de puntuación.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrophyIcon className="size-4" />
            </div>
            <span className="font-bold text-sm">Quiniela Mundial 2026</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Ingresar</Link></Button>
            <Button asChild size="sm"><Link href="/register">Registrarse gratis</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
        <Badge variant="info" className="mb-4">🌎 Mundial 2026 · USA, México & Canadá</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          La quiniela del <span className="text-primary">mundial más grande</span> de la historia
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          48 selecciones, 104 partidos, y tus predicciones. Crea tu quiniela, invita a tus amigos y demuestra quién sabe más de fútbol.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link href="/register">
              Crear quiniela gratis <ArrowRightIcon className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="rounded-xl border p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 Quiniela Mundial · Hecho con ❤️ para los fanáticos del fútbol
      </footer>
    </div>
  )
}

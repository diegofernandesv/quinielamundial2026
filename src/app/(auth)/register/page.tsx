"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2Icon, TrophyIcon, UserIcon, ShieldIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerAdminRequest } from '@/actions/requestAccess'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { cn } from '@/lib/utils'

type AccountType = 'player' | 'admin'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('player')
  const supabase = createClient()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', full_name: '', nickname: '' },
  })

  async function onSubmit(data: RegisterInput) {
    setLoading(true)

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, nickname: data.nickname },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (accountType === 'admin' && authData.user) {
      const displayName = data.nickname || data.full_name
      await registerAdminRequest(authData.user.id, displayName, data.email)
      toast.success('Solicitud enviada. Recibirás acceso de administrador tras la aprobación.')
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.')
    }

    setLoading(false)
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground mx-auto">
            <TrophyIcon className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm">Únete a la mejor quiniela del mundial</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Tipo de cuenta</CardTitle>
            <CardDescription>Elige cómo vas a participar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Account type picker */}
            <div className="grid grid-cols-2 gap-3">
              <AccountTypeCard
                type="player"
                selected={accountType === 'player'}
                onSelect={() => setAccountType('player')}
                icon={UserIcon}
                title="Jugador"
                description="Únete a quinielas con código y haz tus predicciones"
              />
              <AccountTypeCard
                type="admin"
                selected={accountType === 'admin'}
                onSelect={() => setAccountType('admin')}
                icon={ShieldIcon}
                title="Administrador"
                description="Crea y gestiona tus propias quinielas"
              />
            </div>

            {accountType === 'admin' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium mb-0.5">Requiere aprobación</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Tu solicitud se enviará al administrador. Podrás crear quinielas una vez aprobado.
                </p>
              </div>
            )}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Diego Fernández" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nickname" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="DiegoFdez" autoComplete="username" {...field} />
                    </FormControl>
                    <FormDescription>Visible en el ranking — solo letras, números y _</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  {accountType === 'admin' ? 'Solicitar cuenta de administrador' : 'Crear cuenta de jugador'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground pt-0">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline ml-1">
              Inicia sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function AccountTypeCard({
  type, selected, onSelect, icon: Icon, title, description,
}: {
  type: AccountType
  selected: boolean
  onSelect: () => void
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40"
      )}
    >
      <div className={cn(
        "flex size-9 items-center justify-center rounded-lg",
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
      </div>
    </button>
  )
}

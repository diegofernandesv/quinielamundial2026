"use client"
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2Icon, LogOutIcon, SaveIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { UserAvatar } from '@/components/layout/UserAvatar'
import type { Profile } from '@/types/database'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  nickname: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
  country_code: z.string().length(2).optional().or(z.literal('')),
})
type ProfileInput = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const supabase = createClient()

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', nickname: '', country_code: '' },
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data as Profile)
        form.reset({ full_name: data.full_name ?? '', nickname: data.nickname ?? '', country_code: data.country_code ?? '' })
      }
    }
    load()
  }, [])

  async function onSubmit(data: ProfileInput) {
    if (!profile) return
    setLoading(true)
    const { error } = await supabase.from('profiles').update(data).eq('id', profile.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Perfil actualizado')
  }

  async function handleLogout() {
    setLoggingOut(true)
    const { error } = await supabase.auth.signOut()
    setLoggingOut(false)
    if (error) {
      toast.error(error.message)
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Edita tu información personal</p>
      </div>

      {profile && (
        <div className="flex items-center gap-4 p-4 rounded-xl border">
          <UserAvatar profile={profile} size="lg" />
          <div>
            <p className="font-semibold">{profile.nickname ?? profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{profile.role}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>Actualiza tu nombre, nickname y país favorito</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nickname" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname (visible en ranking)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="country_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de país (ej: AR, MX, ES)</FormLabel>
                  <FormControl><Input maxLength={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <SaveIcon className="mr-2 size-4" />}
                Guardar cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesión</CardTitle>
          <CardDescription>Cierra tu sesión en este dispositivo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="w-full sm:w-auto">
            {loggingOut ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : <LogOutIcon className="mr-2 size-4" />}
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon, TrophyIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createPoolSchema, type CreatePoolInput } from '@/lib/validations/pool'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function NewPoolForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<CreatePoolInput>({
    resolver: zodResolver(createPoolSchema) as any,
    defaultValues: { name: '', description: '', privacy: 'private', welcome_message: '' },
  })

  async function onSubmit(data: CreatePoolInput) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('No autenticado'); setLoading(false); return }

    const { data: pool, error } = await supabase
      .from('pools')
      .insert({ ...data, owner_id: user.id })
      .select()
      .single()

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('¡Quiniela creada!')
    router.push(`/pools/${pool.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear quiniela</h1>
        <p className="text-muted-foreground mt-1">Configura los detalles de tu nueva quiniela</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5" /> Información básica
          </CardTitle>
          <CardDescription>Estos datos serán visibles para todos los participantes</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la quiniela *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Quiniela de la oficina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe las reglas, premios u otra información..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="privacy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Privada (solo con invitación)</SelectItem>
                        <SelectItem value="public">Pública (visible para todos)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="max_members" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de miembros</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Sin límite" min={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="join_deadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha límite para unirse</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bonus_deadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite predicciones bonus</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="welcome_message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje de bienvenida</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mensaje que verán los participantes al unirse..." rows={2} {...field} />
                  </FormControl>
                  <FormDescription>Opcional · máximo 300 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  Crear quiniela
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

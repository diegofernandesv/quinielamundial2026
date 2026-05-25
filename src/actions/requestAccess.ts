"use server"
import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'dfernandezvieira@gmail.com'

/* Called after admin registers — uses service-role to work before session exists */
export async function registerAdminRequest(
  userId: string,
  displayName: string,
  email: string,
  message: string = ''
): Promise<{ error?: string }> {
  const admin = await createAdminClient()

  // Set role to pending_admin
  await admin.from('profiles').update({ role: 'pending_admin' }).eq('id', userId)

  // Store request
  await admin.from('pool_access_requests').insert({
    user_id: userId,
    message: message.trim() || 'Cuenta de administrador solicitada en el registro.',
  })

  // Fire-and-forget
  sendAccessEmail(userId, displayName, email).catch(console.error)
  return {}
}

/* Called from the "Solicitar acceso" dialog (user already logged in) */
export async function requestPoolAccess(message: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.nickname ?? profile?.full_name ?? 'Usuario'
  const email = profile?.email ?? user.email ?? 'desconocido'

  // Set pending_admin role
  await supabase.from('profiles').update({ role: 'pending_admin' }).eq('id', user.id)

  // Store request — this is the source of truth; email is just a notification
  await supabase.from('pool_access_requests').insert({
    user_id: user.id,
    message: message.trim(),
  })

  // Fire-and-forget — never surface email errors to the user
  sendAccessEmail(user.id, displayName, email).catch(console.error)

  return {}
}

async function sendAccessEmail(
  userId: string,
  displayName: string,
  email: string
): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return {}   // silently skip if not configured

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const reviewUrl = `${appUrl}/admin/access-requests`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'Quiniela Mundial 2026 <onboarding@resend.dev>',
    to: ADMIN_EMAIL,
    subject: `[Quiniela Mundial] Solicitud de administrador — ${displayName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="margin-top: 0;">Nueva solicitud de cuenta de administrador</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #555; width: 120px;"><strong>Nombre</strong></td>
            <td style="padding: 8px 0;">${displayName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;"><strong>Email</strong></td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;"><strong>User ID</strong></td>
            <td style="padding: 8px 0; font-size: 12px; color: #888;">${userId}</td>
          </tr>
        </table>
        <a href="${reviewUrl}"
          style="display: inline-block; background: #111; color: #fff; text-decoration: none;
                 padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Revisar solicitud →
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          Inicia sesión con tu cuenta de administrador para aprobar o rechazar desde el panel.
        </p>
      </div>
    `,
  })

  if (error) return { error: 'No se pudo enviar el email de notificación.' }
  return {}
}

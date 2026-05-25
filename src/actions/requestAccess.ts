"use server"
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'dfernandezvieira@gmail.com'

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

  // Persist the request so it can be reviewed in Supabase
  await supabase.from('pool_access_requests').insert({
    user_id: user.id,
    message: message.trim(),
  })

  // Send email notification
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { error: 'Email service not configured' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const reviewUrl = `${appUrl}/admin/access-requests`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'Quiniela Mundial 2026 <onboarding@resend.dev>',
    to: ADMIN_EMAIL,
    subject: `[Quiniela Mundial] Solicitud de acceso de ${displayName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="margin-top: 0;">Solicitud de acceso para crear quinielas</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #555; width: 120px;"><strong>Nombre</strong></td>
            <td style="padding: 8px 0;">${displayName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;"><strong>Email</strong></td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
        </table>
        ${message.trim() ? `
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-weight: 600;">Mensaje:</p>
          <p style="margin: 0; color: #444; white-space: pre-wrap;">${message.trim()}</p>
        </div>` : ''}
        <a href="${reviewUrl}"
          style="display: inline-block; background: #111; color: #fff; text-decoration: none;
                 padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px;">
          Revisar solicitud →
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          Inicia sesión con tu cuenta de administrador para aprobar o rechazar desde el panel.
        </p>
      </div>
    `,
  })

  if (error) return { error: 'No se pudo enviar el email. Inténtalo de nuevo.' }
  return {}
}

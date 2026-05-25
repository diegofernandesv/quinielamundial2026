"use client"
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckIcon, XIcon, Loader2Icon, PlusIcon, TrashIcon,
  SaveIcon, WalletIcon, TrophyIcon, UsersIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toggleMemberPayment, savePoolPaymentSettings, type PrizeTier } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface Member {
  id: string
  user_id: string
  has_paid: boolean
  paid_at: string | null
  profile: {
    full_name: string | null
    nickname: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export default function PaymentsPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = use(params)
  const [isOwner, setIsOwner] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [entryFee, setEntryFee] = useState<string>('')
  const [tiers, setTiers] = useState<PrizeTier[]>([])
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [ownerUserId, setOwnerUserId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: poolData }, { data: membersData }] = await Promise.all([
        supabase.from('pools').select('owner_id, entry_fee, prize_distribution').eq('id', poolId).single(),
        supabase
          .from('pool_members')
          .select('id, user_id, has_paid, paid_at, profile:profiles(full_name, nickname, email, avatar_url)')
          .eq('pool_id', poolId)
          .eq('is_active', true),
      ])

      if (poolData) {
        setIsOwner(poolData.owner_id === user.id)
        setOwnerUserId(poolData.owner_id)
        setEntryFee(poolData.entry_fee != null ? String(poolData.entry_fee) : '')
        setTiers((poolData.prize_distribution as PrizeTier[]) ?? [])
      }
      setMembers((membersData ?? []) as unknown as Member[])
    }
    load()
  }, [poolId])

  /* ─── Payment toggle ──────────────────────────────────────────── */
  async function handleToggle(member: Member) {
    setToggling(t => ({ ...t, [member.id]: true }))
    const next = !member.has_paid
    const { error } = await toggleMemberPayment(poolId, member.id, next)
    setToggling(t => ({ ...t, [member.id]: false }))
    if (error) { toast.error(error); return }
    setMembers(ms => ms.map(m => m.id === member.id ? { ...m, has_paid: next, paid_at: next ? new Date().toISOString() : null } : m))
    toast.success(next ? 'Pago registrado' : 'Pago revertido')
  }

  /* ─── Prize tiers ─────────────────────────────────────────────── */
  function addTier() {
    const next = tiers.length + 1
    const labels: Record<number, string> = { 1: '1er lugar', 2: '2do lugar', 3: '3er lugar', 4: '4to lugar', 5: '5to lugar' }
    setTiers(t => [...t, { position: next, label: labels[next] ?? `${next}º lugar`, percentage: 0 }])
  }

  function removeTier(idx: number) {
    setTiers(t => t.filter((_, i) => i !== idx).map((tier, i) => ({ ...tier, position: i + 1 })))
  }

  function updateTier(idx: number, field: keyof PrizeTier, value: string | number) {
    setTiers(t => t.map((tier, i) => i === idx ? { ...tier, [field]: field === 'percentage' ? Number(value) : value } : tier))
  }

  async function handleSave() {
    setSaving(true)
    const fee = entryFee ? parseFloat(entryFee) : null
    const { error } = await savePoolPaymentSettings(poolId, fee, tiers)
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Configuración guardada')
  }

  /* ─── Computed stats ──────────────────────────────────────────── */
  const fee = parseFloat(entryFee) || 0
  const paidCount = members.filter(m => m.has_paid).length
  const totalPot = fee * paidCount
  const percentageSum = tiers.reduce((s, t) => s + t.percentage, 0)
  const percentageOk = tiers.length === 0 || Math.abs(percentageSum - 100) < 0.01

  if (!isOwner) {
    return <p className="text-muted-foreground">Solo el administrador de la quiniela puede ver esta sección.</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Pagos y premios</h1>

      {/* ── Summary cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<UsersIcon className="size-4" />}
          label="Han pagado"
          value={`${paidCount} / ${members.length}`}
        />
        <SummaryCard
          icon={<WalletIcon className="size-4" />}
          label="Total recaudado"
          value={fee > 0 ? formatCurrency(totalPot) : '—'}
        />
        <SummaryCard
          icon={<TrophyIcon className="size-4" />}
          label="Bote"
          value={fee > 0 ? formatCurrency(totalPot) : '—'}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* ── Entry fee + prize distribution ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del bote</CardTitle>
          <CardDescription>Define la cuota de entrada y cómo se reparten los premios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Entry fee */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cuota de entrada</label>
            <div className="flex items-center gap-2 max-w-[160px]">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={entryFee}
                onChange={e => setEntryFee(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Prize distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Reparto de premios</label>
              {tiers.length > 0 && (
                <span className={`text-xs font-medium ${percentageOk ? 'text-green-600' : 'text-destructive'}`}>
                  {percentageSum.toFixed(0)}% / 100%
                </span>
              )}
            </div>

            {tiers.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay posiciones configuradas. Añade una para empezar.</p>
            )}

            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground text-xs font-bold shrink-0">
                    {tier.position}
                  </div>
                  <Input
                    placeholder="Ej: 1er lugar"
                    value={tier.label}
                    onChange={e => updateTier(idx, 'label', e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 w-28 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={tier.percentage || ''}
                      onChange={e => updateTier(idx, 'percentage', e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  {fee > 0 && (
                    <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                      {formatCurrency(totalPot * tier.percentage / 100)}
                    </span>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => removeTier(idx)}>
                    <TrashIcon className="size-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addTier} className="w-full">
              <PlusIcon className="size-4 mr-1.5" />
              Añadir posición
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !percentageOk}
            size="sm"
            className="w-full"
          >
            {saving
              ? <><Loader2Icon className="mr-2 size-4 animate-spin" />Guardando...</>
              : <><SaveIcon className="mr-2 size-4" />Guardar configuración</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* ── Member payment list ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="size-4" />
            Participantes ({members.length})
          </CardTitle>
          <CardDescription>Marca quién ha pagado su cuota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map(member => {
            const name = member.profile?.nickname ?? member.profile?.full_name ?? 'Usuario'
            const initials = name.slice(0, 2).toUpperCase()
            const isLoading = toggling[member.id]
            const isPoolOwner = member.user_id === ownerUserId

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <Avatar className="size-8 shrink-0">
                  {member.profile?.avatar_url && <AvatarFallback>{initials}</AvatarFallback>}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {isPoolOwner && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.profile?.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {fee > 0 && (
                    <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                      {formatCurrency(fee)}
                    </span>
                  )}
                  <button
                    onClick={() => handleToggle(member)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      member.has_paid
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {isLoading
                      ? <Loader2Icon className="size-3 animate-spin" />
                      : member.has_paid
                        ? <CheckIcon className="size-3" />
                        : <XIcon className="size-3" />
                    }
                    {member.has_paid ? 'Pagado' : 'Pendiente'}
                  </button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Prize breakdown summary ────────────────────────────────── */}
      {tiers.length > 0 && fee > 0 && totalPot > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrophyIcon className="size-4" />
              Distribución del bote
            </CardTitle>
            <CardDescription>
              Basado en {paidCount} pago{paidCount !== 1 ? 's' : ''} × {formatCurrency(fee)} = {formatCurrency(totalPot)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tiers.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {tier.position}
                  </span>
                  <span className="text-sm font-medium">{tier.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(totalPot * tier.percentage / 100)}</p>
                  <p className="text-xs text-muted-foreground">{tier.percentage}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)
}

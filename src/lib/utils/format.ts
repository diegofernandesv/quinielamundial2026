import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatMatchDate(dateStr: string) {
  return format(new Date(dateStr), "d MMM, HH:mm", { locale: es })
}

export function formatFullDate(dateStr: string) {
  return format(new Date(dateStr), "d 'de' MMMM yyyy", { locale: es })
}

export function formatRelative(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
}

export function isDeadlinePassed(dateStr: string | null | undefined) {
  if (!dateStr) return false
  return isAfter(new Date(), new Date(dateStr))
}

export function isMatchLocked(scheduledAt: string) {
  return isAfter(new Date(), new Date(scheduledAt))
}

export function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function formatPoints(points: number | null | undefined) {
  if (points === null || points === undefined) return '—'
  return points % 1 === 0 ? points.toString() : points.toFixed(1)
}

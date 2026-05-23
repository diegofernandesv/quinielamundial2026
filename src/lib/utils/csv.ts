import type { LeaderboardEntry } from '@/types/database'

export function leaderboardToCSV(entries: LeaderboardEntry[]): string {
  const headers = ['Posición', 'Nickname', 'Puntos', 'Predicciones', 'Marcadores Exactos', 'Resultados Correctos', 'Bonus']
  const rows = entries.map(e => [
    e.position ?? '',
    e.profile?.nickname ?? e.profile?.full_name ?? '',
    e.total_points,
    e.predictions_made,
    e.exact_scores,
    e.correct_results,
    e.bonus_points,
  ])
  return [headers, ...rows].map(r => r.join(',')).join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

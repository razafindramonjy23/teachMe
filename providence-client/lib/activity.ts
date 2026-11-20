/**
 * Activité d'un apprenant dans le temps — calculs purs (aucun accès réseau,
 * aucun état React), à partir des horodatages `done_at` de `resource_progress`.
 *
 * Comme lib/gamification.ts, tout est calculé dans le fuseau de Madagascar :
 * une ressource terminée à 1 h du matin appartient bien à ce jour-là pour
 * l'apprenant, pas à la veille en UTC.
 *
 * Ce module alimente les graphiques de l'accueil et de la page Statistiques.
 * Il ne connaît ni React ni le catalogue : on lui passe des dates, il rend des
 * séries prêtes à dessiner.
 */

import { MADAGASCAR_TZ, localDay, shiftDay } from './gamification.ts'

/** Heure locale (0-23) d'un instant, dans le fuseau donné. */
export function localHour(at: string | Date, timeZone: string = MADAGASCAR_TZ): number {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false })
  return Number(fmt.format(typeof at === 'string' ? new Date(at) : at)) % 24
}

/** Jour de la semaine d'un jour « AAAA-MM-JJ » : 1 = lundi … 7 = dimanche. */
export function weekdayOf(day: string): number {
  const d = new Date(`${day}T00:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

/** Lundi de la semaine qui contient ce jour « AAAA-MM-JJ ». */
export function startOfWeek(day: string): string {
  return shiftDay(day, -(weekdayOf(day) - 1))
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Étiquette courte d'un jour « AAAA-MM-JJ » : « 17 sept. ». */
export function shortDayLabel(day: string): string {
  const [, month, date] = day.split('-')
  return `${Number(date)} ${MONTHS_FR[Number(month) - 1]}`
}

export type DayPoint = { day: string; count: number }
export type WeekPoint = { weekStart: string; label: string; count: number }
export type HourPoint = { hour: number; count: number }

/**
 * Nombre de ressources terminées chaque jour, sur les `days` derniers jours,
 * du plus ancien au plus récent. Les jours sans activité valent 0 : la série
 * est continue, donc directement traçable.
 */
export function dailyActivity(doneAt: string[], days: number, now: Date = new Date()): DayPoint[] {
  const counts = new Map<string, number>()
  for (const at of doneAt) {
    const day = localDay(at)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  const today = localDay(now)
  const points: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = shiftDay(today, -i)
    points.push({ day, count: counts.get(day) ?? 0 })
  }
  return points
}

/**
 * Nombre de ressources terminées chaque semaine (semaines du lundi au
 * dimanche), sur les `weeks` dernières semaines, de la plus ancienne à la plus
 * récente. La dernière semaine est celle d'aujourd'hui, même incomplète.
 */
export function weeklyActivity(doneAt: string[], weeks: number, now: Date = new Date()): WeekPoint[] {
  const counts = new Map<string, number>()
  for (const at of doneAt) {
    const week = startOfWeek(localDay(at))
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  const currentWeek = startOfWeek(localDay(now))
  const points: WeekPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = shiftDay(currentWeek, -7 * i)
    points.push({ weekStart, label: shortDayLabel(weekStart), count: counts.get(weekStart) ?? 0 })
  }
  return points
}

/**
 * Répartition par heure de la journée, sur les `days` derniers jours.
 * Toujours 24 points, de 0 h à 23 h — un cadran a besoin de tous ses secteurs.
 */
export function hourlyActivity(doneAt: string[], days: number, now: Date = new Date()): HourPoint[] {
  const today = localDay(now)
  const from = shiftDay(today, -(days - 1))
  const counts = new Array<number>(24).fill(0)
  for (const at of doneAt) {
    if (localDay(at) < from) continue
    counts[localHour(at)]++
  }
  return counts.map((count, hour) => ({ hour, count }))
}

/**
 * Heure la plus active, ou `null` si rien n'a été terminé sur la période.
 * À égalité, l'heure la plus matinale gagne : c'est la plus représentative
 * d'une habitude de travail.
 */
export function peakHour(points: HourPoint[]): number | null {
  let best: HourPoint | null = null
  for (const p of points) {
    if (p.count > 0 && (best === null || p.count > best.count)) best = p
  }
  return best?.hour ?? null
}

/** Ressources terminées sur les `days` derniers jours (aujourd'hui inclus). */
export function countSince(doneAt: string[], days: number, now: Date = new Date()): number {
  const from = shiftDay(localDay(now), -(days - 1))
  return doneAt.filter(at => localDay(at) >= from).length
}

/** Première activité enregistrée, « AAAA-MM-JJ », ou `null` si aucune. */
export function firstActiveDay(doneAt: string[]): string | null {
  let first: string | null = null
  for (const at of doneAt) {
    const day = localDay(at)
    if (first === null || day < first) first = day
  }
  return first
}

export type Share<T> = T & { count: number; share: number }

/**
 * Parts en pourcentage d'un ensemble de catégories, triées de la plus grande à
 * la plus petite, les catégories vides écartées. Les parts somment à 100 % aux
 * arrondis près ; on ne redistribue pas le reste, un total de 99 % ou 101 %
 * vaut mieux qu'une valeur faussée pour faire joli.
 */
export function shares<T extends { count: number }>(items: T[]): Share<T>[] {
  const total = items.reduce((n, i) => n + i.count, 0)
  if (total === 0) return []
  return items
    .filter(i => i.count > 0)
    .map(i => ({ ...i, share: Math.round((i.count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Moyenne de ressources par jour actif (jours sans rien exclus) sur la
 * période. `0` si aucun jour actif — diviser par zéro n'a rien à dire à
 * l'apprenant.
 */
export function perActiveDay(points: DayPoint[]): number {
  const active = points.filter(p => p.count > 0)
  if (active.length === 0) return 0
  const total = active.reduce((n, p) => n + p.count, 0)
  return Math.round((total / active.length) * 10) / 10
}

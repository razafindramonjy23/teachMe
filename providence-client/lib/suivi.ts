/**
 * Suivi des apprenants (vue encadrant) — calculs purs, testés dans
 * tests/suivi.test.ts.
 *
 * Objectif : repérer en un coup d'œil qui décroche, et voir où en est chaque
 * apprenant. Lecture seule : la progression reste déclarée par l'apprenant.
 */

import { computeStats, focusLevel, localDay } from './gamification.ts'

/** Au-delà de ce nombre de jours sans activité, l'apprenant est « à relancer ». */
export const INACTIVE_AFTER_DAYS = 7

export type SuiviStatus = 'actif' | 'a-relancer' | 'jamais'

export const STATUS_LABEL: Record<SuiviStatus, string> = {
  actif: 'Actif',
  'a-relancer': 'À relancer',
  jamais: 'Jamais commencé',
}

export type StudentProfile = {
  id: string
  name: string
  matricule: string | null
  /** Organisation de rattachement ; null = aucune. */
  organisationId: string | null
  /** Niveau fixé par l'administration (ex. « Beginner »). */
  level: string | null
  createdAt: string
}

export type ProgressRow = {
  userId: string
  resourceId: string
  levelSlug: string
  openedAt: string | null
  doneAt: string | null
}

export type CatalogLevel = {
  slug: string
  name: string
  code: string
  kind: 'niveau' | 'parcours'
  ids: string[]
}

export type LevelProgress = { slug: string; name: string; code: string; kind: 'niveau' | 'parcours'; done: number; total: number }

export type StudentSummary = StudentProfile & {
  doneCount: number
  /** Ressources terminées ces 7 derniers jours. */
  doneThisWeek: number
  lastActivityAt: string | null
  /** Jours calendaires (heure de Madagascar) depuis la dernière activité. */
  daysSinceActivity: number | null
  status: SuiviStatus
  streak: number
  /** Étape recommandée sur le parcours A1 → C1, avec son avancement. */
  focus: LevelProgress | null
  levels: LevelProgress[]
}

/** Écart en jours calendaires entre deux jours « AAAA-MM-JJ ». */
function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export function summarizeStudents(
  profiles: StudentProfile[],
  rows: ProgressRow[],
  catalog: CatalogLevel[],
  now: Date = new Date(),
): StudentSummary[] {
  const catalogIds = new Set(catalog.flatMap(l => l.ids))
  const byUser = new Map<string, ProgressRow[]>()
  for (const r of rows) {
    const list = byUser.get(r.userId)
    if (list) list.push(r)
    else byUser.set(r.userId, [r])
  }
  const today = localDay(now)
  const weekAgo = now.getTime() - 7 * 86_400_000

  return profiles.map(p => {
    const mine = byUser.get(p.id) ?? []
    const done = mine.filter(r => r.doneAt && catalogIds.has(r.resourceId))
    const doneIds = new Set(done.map(r => r.resourceId))

    let lastActivityAt: string | null = null
    let lastActivitySlug: string | null = null
    for (const r of mine) {
      for (const at of [r.openedAt, r.doneAt]) {
        if (at && (!lastActivityAt || at > lastActivityAt)) {
          lastActivityAt = at
          lastActivitySlug = r.levelSlug
        }
      }
    }

    const daysSinceActivity = lastActivityAt ? dayDiff(localDay(lastActivityAt), today) : null
    const status: SuiviStatus =
      lastActivityAt === null ? 'jamais' : (daysSinceActivity ?? 0) >= INACTIVE_AFTER_DAYS ? 'a-relancer' : 'actif'

    const levels: LevelProgress[] = catalog.map(l => ({
      slug: l.slug,
      name: l.name,
      code: l.code,
      kind: l.kind,
      done: l.ids.filter(id => doneIds.has(id)).length,
      total: l.ids.length,
    }))
    const path = levels.filter(l => l.kind === 'niveau')
    const profileLevelSlug = path.find(l => l.name.toLowerCase() === (p.level ?? '').toLowerCase())?.slug ?? null
    const focusSlug = focusLevel({
      order: path.map(l => l.slug),
      isComplete: slug => {
        const l = path.find(x => x.slug === slug)
        return !!l && l.total > 0 && l.done === l.total
      },
      lastActivitySlug,
      profileLevelSlug,
    })

    return {
      ...p,
      doneCount: doneIds.size,
      doneThisWeek: done.filter(r => Date.parse(r.doneAt as string) >= weekAgo).length,
      lastActivityAt,
      daysSinceActivity,
      status,
      streak: computeStats(done.map(r => r.doneAt as string), now).streak,
      focus: path.find(l => l.slug === focusSlug) ?? null,
      levels,
    }
  })
}

export type SuiviOverview = {
  total: number
  actifs: number
  aRelancer: number
  jamais: number
  doneThisWeek: number
}

export function overview(students: StudentSummary[]): SuiviOverview {
  return {
    total: students.length,
    actifs: students.filter(s => s.status === 'actif').length,
    aRelancer: students.filter(s => s.status === 'a-relancer').length,
    jamais: students.filter(s => s.status === 'jamais').length,
    doneThisWeek: students.reduce((n, s) => n + s.doneThisWeek, 0),
  }
}

export type SuiviSort = 'priorite' | 'nom' | 'avancement' | 'activite'

const STATUS_PRIORITY: Record<SuiviStatus, number> = { 'a-relancer': 0, jamais: 1, actif: 2 }

/**
 * Tri « priorité » (par défaut) : d'abord les apprenants à relancer — les plus
 * anciennement inactifs en tête —, puis ceux qui n'ont jamais commencé, puis
 * les actifs.
 */
export function sortStudents(students: StudentSummary[], sort: SuiviSort): StudentSummary[] {
  const byName = (a: StudentSummary, b: StudentSummary) => a.name.localeCompare(b.name, 'fr')
  const list = [...students]
  switch (sort) {
    case 'nom':
      return list.sort(byName)
    case 'avancement':
      return list.sort((a, b) => b.doneCount - a.doneCount || byName(a, b))
    case 'activite':
      return list.sort((a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? '') || byName(a, b))
    case 'priorite':
    default:
      return list.sort(
        (a, b) =>
          STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] ||
          (b.daysSinceActivity ?? 0) - (a.daysSinceActivity ?? 0) ||
          byName(a, b),
      )
  }
}

// ── Vue d'ensemble : tendance et répartition par site ───────────────────────

export type WeekPoint = {
  /** Lundi de la semaine, « AAAA-MM-JJ » (heure de Madagascar). */
  weekStart: string
  /** Ressources terminées dans la semaine. */
  done: number
  /** Apprenants distincts ayant ouvert ou terminé au moins une ressource. */
  activeStudents: number
}

/** Lundi de la semaine d'un jour « AAAA-MM-JJ ». */
export function mondayOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  const offset = (d.getUTCDay() + 6) % 7 // lundi = 0 … dimanche = 6
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}

/**
 * Activité des `weeks` dernières semaines, de la plus ancienne à la semaine en
 * cours (incluse, donc partielle). Semaines du lundi au dimanche, à l'heure de
 * Madagascar.
 */
export function weeklyActivity(rows: ProgressRow[], now: Date = new Date(), weeks = 8): WeekPoint[] {
  const current = mondayOf(localDay(now))
  const starts: string[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${current}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 7 * i)
    starts.push(d.toISOString().slice(0, 10))
  }
  const index = new Map(starts.map((s, i) => [s, i]))
  const done = new Array<number>(weeks).fill(0)
  const active = starts.map(() => new Set<string>())

  for (const r of rows) {
    if (r.doneAt) {
      const i = index.get(mondayOf(localDay(r.doneAt)))
      if (i !== undefined) done[i]++
    }
    for (const at of [r.openedAt, r.doneAt]) {
      if (!at) continue
      const i = index.get(mondayOf(localDay(at)))
      if (i !== undefined) active[i].add(r.userId)
    }
  }
  return starts.map((weekStart, i) => ({ weekStart, done: done[i], activeStudents: active[i].size }))
}

export type OrganisationBreakdown = {
  organisationId: string | null
  total: number
  actifs: number
  aRelancer: number
  jamais: number
}

/**
 * Répartition des statuts par organisation. Tri par nombre d'apprenants
 * décroissant ; « sans organisation » toujours en dernier.
 */
export function byOrganisation(students: StudentSummary[]): OrganisationBreakdown[] {
  const map = new Map<string | null, OrganisationBreakdown>()
  for (const s of students) {
    const key = s.organisationId ?? null
    const row = map.get(key) ?? { organisationId: key, total: 0, actifs: 0, aRelancer: 0, jamais: 0 }
    row.total++
    if (s.status === 'actif') row.actifs++
    else if (s.status === 'a-relancer') row.aRelancer++
    else row.jamais++
    map.set(key, row)
  }
  return Array.from(map.values()).sort((a, b) =>
    a.organisationId === null ? 1 : b.organisationId === null ? -1 : b.total - a.total,
  )
}

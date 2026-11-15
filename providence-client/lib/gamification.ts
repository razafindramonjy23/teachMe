/**
 * Parcours gamifié — calculs purs (aucun accès réseau, aucun état React).
 *
 * Tout se déduit des horodatages `done_at` de `resource_progress`, fixés par
 * le serveur (migration 0004) : on ne peut ni antidater une coche, ni
 * fabriquer une série.
 *
 * Les « jours » sont ceux de Madagascar (UTC+3, sans heure d'été). Calculés en
 * UTC, une ressource terminée à 1 h du matin compterait pour la veille et la
 * série casserait sans raison.
 */

export const MADAGASCAR_TZ = 'Indian/Antananarivo'
export const DAILY_GOAL = 2
export const PAGES_PER_RESOURCE = 10
export const STREAK_STAMPS = [7, 30] as const

const dayFormatter = new Map<string, Intl.DateTimeFormat>()

/** Jour calendaire « AAAA-MM-JJ » d'un instant, dans le fuseau donné. */
export function localDay(at: string | Date, timeZone: string = MADAGASCAR_TZ): string {
  let fmt = dayFormatter.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    dayFormatter.set(timeZone, fmt)
  }
  return fmt.format(typeof at === 'string' ? new Date(at) : at)
}

/** Décale un jour « AAAA-MM-JJ » de `delta` jours (arithmétique de calendrier pure). */
export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

export type Stats = {
  /** Ressources terminées (au catalogue). */
  doneCount: number
  /** 10 pages par ressource terminée. */
  pages: number
  /** Ressources terminées aujourd'hui, heure de Madagascar. */
  todayCount: number
  goal: number
  goalReached: boolean
  /** Jours consécutifs avec au moins une ressource terminée. */
  streak: number
  /** La série tient grâce à hier, mais rien n'est encore terminé aujourd'hui. */
  streakAtRisk: boolean
  bestStreak: number
}

/**
 * Statistiques d'un apprenant à partir des dates `done_at` de ses ressources
 * terminées. Une série reste en cours tant que la veille compte : on ne la
 * perd qu'après une journée entière sans rien terminer.
 */
export function computeStats(doneAt: string[], now: Date = new Date()): Stats {
  const days = new Set(doneAt.map(d => localDay(d)))
  const today = localDay(now)
  const yesterday = shiftDay(today, -1)

  let streak = 0
  const start = days.has(today) ? today : days.has(yesterday) ? yesterday : null
  for (let d = start; d !== null && days.has(d); d = shiftDay(d, -1)) streak++

  let bestStreak = 0
  let run = 0
  let previous: string | null = null
  for (const d of Array.from(days).sort()) {
    run = previous !== null && shiftDay(previous, 1) === d ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    previous = d
  }

  const todayCount = doneAt.filter(d => localDay(d) === today).length
  return {
    doneCount: doneAt.length,
    pages: doneAt.length * PAGES_PER_RESOURCE,
    todayCount,
    goal: DAILY_GOAL,
    goalReached: todayCount >= DAILY_GOAL,
    streak,
    streakAtRisk: streak > 0 && !days.has(today),
    bestStreak,
  }
}

export type StampLevel = {
  slug: string
  name: string
  code: string
  kind: 'niveau' | 'parcours'
  /** Identifiants des ressources du niveau. */
  ids: string[]
}

export type Stamp = {
  id: string
  code: string
  label: string
  kicker: string
  earned: boolean
  /** Comment l'obtenir, ou comment il a été obtenu. */
  condition: string
}

/**
 * Le carnet de tampons : premier pas, un tampon par niveau et par parcours
 * bouclé, et des tampons de série (meilleure série, pour qu'un tampon obtenu
 * ne disparaisse pas quand la série casse).
 */
export function computeStamps(input: {
  levels: StampLevel[]
  isDone: (id: string) => boolean
  doneCount: number
  bestStreak: number
}): Stamp[] {
  const { levels, isDone, doneCount, bestStreak } = input
  const stamps: Stamp[] = [
    {
      id: 'premier-pas',
      code: '1er',
      label: 'Premier pas',
      kicker: 'page',
      earned: doneCount > 0,
      condition:
        doneCount > 0
          ? 'Obtenu en terminant votre toute première ressource.'
          : 'Terminez votre première ressource.',
    },
  ]

  const levelStamp = (l: StampLevel): Stamp => {
    const total = l.ids.length
    const done = l.ids.filter(isDone).length
    const earned = total > 0 && done === total
    return {
      id: `${l.kind}-${l.slug}`,
      code: l.code,
      label: l.name,
      kicker: l.kind,
      earned,
      condition: earned
        ? `Obtenu en terminant les ${total} ressources de ${l.name}.`
        : `Terminez les ${total} ressources de ${l.name}. Vous en êtes à ${done}.`,
    }
  }

  stamps.push(...levels.filter(l => l.kind === 'niveau').map(levelStamp))
  for (const days of STREAK_STAMPS) {
    const earned = bestStreak >= days
    stamps.push({
      id: `serie-${days}`,
      code: `${days} j`,
      label: `Série de ${days} jours`,
      kicker: 'série',
      earned,
      condition: earned
        ? `Obtenu en terminant au moins une ressource par jour, ${days} jours d’affilée.`
        : `Terminez au moins une ressource par jour, ${days} jours d’affilée. Meilleure série : ${bestStreak} jour${bestStreak > 1 ? 's' : ''}.`,
    })
  }
  stamps.push(...levels.filter(l => l.kind === 'parcours').map(levelStamp))
  return stamps
}

/**
 * Étape mise en avant sur le parcours. Rien n'est jamais verrouillé : c'est
 * une recommandation. Ordre de priorité :
 *   1. le niveau de la dernière activité, s'il n'est pas bouclé ;
 *   2. le niveau du profil (fixé par l'administration), s'il n'est pas bouclé ;
 *   3. le premier niveau non bouclé dans l'ordre du parcours.
 * `null` si tout est bouclé.
 */
export function focusLevel(input: {
  order: string[]
  isComplete: (slug: string) => boolean
  lastActivitySlug?: string | null
  profileLevelSlug?: string | null
}): string | null {
  const { order, isComplete, lastActivitySlug, profileLevelSlug } = input
  for (const candidate of [lastActivitySlug, profileLevelSlug]) {
    if (candidate && order.includes(candidate) && !isComplete(candidate)) return candidate
  }
  return order.find(slug => !isComplete(slug)) ?? null
}

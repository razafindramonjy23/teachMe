'use client'

/**
 * Assemble le parcours gamifié à partir de la progression enregistrée et du
 * catalogue. Toute la logique de calcul vit dans lib/gamification.ts (testée) ;
 * ce hook ne fait que brancher les données.
 */

import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { useProgress } from '@/lib/progress'
import { LEVELS, COURSES, type Accent } from '@/lib/catalog'
import { levelResourceIds, allResourceIds, findResource, type ResourceLocation } from '@/lib/resources'
import { computeStats, computeStamps, focusLevel, type Stamp, type Stats } from '@/lib/gamification'

export type PathStep = {
  slug: string
  name: string
  code: string
  accent: Accent
  href: string
  ids: string[]
  total: number
  done: number
  complete: boolean
}

export type Parcours = {
  isLoading: boolean
  stats: Stats
  /** Les 6 niveaux du cadre européen, dans l'ordre du chemin. */
  path: PathStep[]
  /** Les parcours spécialisés (Aviation, Business, CAE, IELTS). */
  courses: PathStep[]
  /** Étape recommandée — jamais un verrou. `null` si tout est bouclé. */
  focus: string | null
  stamps: Stamp[]
  /** Dernière ressource ouverte et non terminée. */
  resume: ResourceLocation | null
}

export function useParcours(): Parcours {
  const { user } = useAuth()
  const { entries, isLoading, countDone, isDone, lastOpened } = useProgress()
  const profileLevel = user?.level ?? ''

  return useMemo(() => {
    const catalog = new Set(allResourceIds())
    const list = Object.values(entries)

    const doneAt = list
      .filter(e => e.doneAt && catalog.has(e.resourceId))
      .map(e => e.doneAt as string)
    const stats = computeStats(doneAt)

    const toStep = (l: (typeof LEVELS)[number] | (typeof COURSES)[number]): PathStep => {
      const ids = levelResourceIds(l.slug)
      const done = countDone(ids)
      return {
        slug: l.slug,
        name: l.name,
        code: l.code,
        accent: l.accent,
        href: l.href,
        ids,
        total: ids.length,
        done,
        complete: ids.length > 0 && done === ids.length,
      }
    }
    const path = LEVELS.map(toStep)
    const courses = COURSES.map(toStep)

    // Niveau de la dernière activité (ouverture ou coche la plus récente)
    let lastActivitySlug: string | null = null
    let lastActivityAt = ''
    for (const e of list) {
      const at = [e.doneAt, e.openedAt].filter(Boolean).sort().pop() ?? ''
      if (at > lastActivityAt) {
        lastActivityAt = at
        lastActivitySlug = e.levelSlug
      }
    }

    const profileLevelSlug =
      LEVELS.find(l => l.name.toLowerCase() === profileLevel.toLowerCase())?.slug ?? null

    const focus = focusLevel({
      order: path.map(s => s.slug),
      isComplete: slug => path.find(s => s.slug === slug)?.complete ?? false,
      lastActivitySlug,
      profileLevelSlug,
    })

    const stamps = computeStamps({
      levels: [
        ...path.map(s => ({ slug: s.slug, name: s.name, code: s.code, kind: 'niveau' as const, ids: s.ids })),
        ...courses.map(s => ({ slug: s.slug, name: s.name, code: s.code, kind: 'parcours' as const, ids: s.ids })),
      ],
      isDone,
      doneCount: stats.doneCount,
      bestStreak: stats.bestStreak,
    })

    const resume = lastOpened ? findResource(lastOpened.resourceId) : null

    return { isLoading, stats, path, courses, focus, stamps, resume }
  }, [entries, isLoading, countDone, isDone, lastOpened, profileLevel])
}

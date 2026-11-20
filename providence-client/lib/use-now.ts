'use client'

/**
 * « Ressource en cours » — ce que la barre épinglée en bas de l'écran pilote.
 *
 * La ressource en cours est la dernière ouverte et non terminée ; à défaut, la
 * première ressource non terminée de l'étape recommandée. La file est celle de
 * son niveau, dans l'ordre d'affichage : précédent et suivant s'y déplacent,
 * exactement comme on avance dans une liste de lecture.
 *
 * Rien n'est verrouillé : « au hasard » peut envoyer sur n'importe quelle
 * ressource non terminée du catalogue, tous niveaux confondus.
 */

import { useCallback, useMemo } from 'react'
import { useProgress } from '@/lib/progress'
import { useParcours } from '@/lib/use-parcours'
import { findResource, levelResourceLocations, type ResourceLocation } from '@/lib/resources'
import { LEVELS, COURSES } from '@/lib/catalog'

export type NowPlaying = {
  /** Ressource mise en avant, ou `null` si le catalogue est vide. */
  current: ResourceLocation | null
  /** Rang dans son niveau, à partir de 1 (0 si aucune ressource). */
  position: number
  /** Nombre de ressources du niveau. */
  total: number
  /** Ressources terminées dans ce niveau. */
  done: number
  /** La ressource en cours est-elle cochée ? */
  isCurrentDone: boolean
  previous: ResourceLocation | null
  next: ResourceLocation | null
  /** Une ressource non terminée au hasard, tous niveaux confondus. */
  pickRandom: () => ResourceLocation | null
}

export function useNowPlaying(): NowPlaying {
  const { lastOpened, isDone, countDone } = useProgress()
  const { focus } = useParcours()

  return useMemo(() => {
    const empty: NowPlaying = {
      current: null,
      position: 0,
      total: 0,
      done: 0,
      isCurrentDone: false,
      previous: null,
      next: null,
      pickRandom: () => null,
    }

    // 1. la dernière ressource ouverte et non terminée
    let current = lastOpened ? findResource(lastOpened.resourceId) : null

    // 2. sinon, la première non terminée de l'étape recommandée
    const fallbackSlug = focus ?? LEVELS[0]?.slug ?? null
    if (!current && fallbackSlug) {
      const queue = levelResourceLocations(fallbackSlug)
      current = queue.find(r => !isDone(r.id)) ?? queue[0] ?? null
    }
    if (!current) return empty

    const queue = levelResourceLocations(current.levelSlug)
    const index = queue.findIndex(r => r.id === current.id)

    const pickRandom = () => {
      const pool = [...LEVELS, ...COURSES]
        .flatMap(l => levelResourceLocations(l.slug))
        .filter(r => !isDone(r.id) && r.id !== current.id)
      if (pool.length === 0) return null
      return pool[Math.floor(Math.random() * pool.length)]
    }

    return {
      current,
      position: index >= 0 ? index + 1 : 0,
      total: queue.length,
      done: countDone(queue.map(r => r.id)),
      isCurrentDone: isDone(current.id),
      previous: index > 0 ? queue[index - 1] : null,
      next: index >= 0 && index < queue.length - 1 ? queue[index + 1] : null,
      pickRandom,
    }
  }, [lastOpened, focus, isDone, countDone])
}

/** Ressource ouverte « hors file » — la barre la mémorise le temps de la session. */
export function useOpenResource() {
  const { markOpened } = useProgress()
  return useCallback(
    (resource: ResourceLocation) => {
      markOpened(resource.id, resource.levelSlug)
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    },
    [markOpened],
  )
}

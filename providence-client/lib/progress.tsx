'use client'

/**
 * Progression des apprenants.
 *
 * Deux signaux, une seule table (`resource_progress`) :
 *   - `opened_at` : écrit automatiquement au clic sur une ressource
 *   - `done_at`   : écrit quand l'apprenant coche « terminé »
 *
 * Les écritures sont optimistes : l'interface réagit immédiatement et
 * l'enregistrement part en arrière-plan. En cas d'échec réseau, l'état local
 * est restauré — on ne laisse jamais une coche mentir à l'apprenant.
 *
 * Le RLS de Supabase garantit qu'un apprenant ne lit et n'écrit que ses lignes.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

export type ProgressEntry = {
  resourceId: string
  levelSlug: string
  openedAt: string | null
  doneAt: string | null
}

type ProgressMap = Record<string, ProgressEntry>

type ProgressContextValue = {
  entries: ProgressMap
  isLoading: boolean
  /** Marque une ressource comme ouverte (idempotent : n'écrase pas la 1re ouverture). */
  markOpened: (resourceId: string, levelSlug: string) => void
  /** Coche / décoche « terminé ». */
  toggleDone: (resourceId: string, levelSlug: string) => void
  /** Progression d'un niveau : nombre de ressources terminées. */
  doneCountForLevel: (levelSlug: string) => number
  /** Nombre total de ressources terminées, tous niveaux confondus. */
  totalDone: number
  /** Dernière ressource ouverte et non terminée, pour le bloc « Reprendre ». */
  lastOpened: ProgressEntry | null
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProgressMap>({})
  const [isLoading, setIsLoading] = useState(true)

  // Chargement initial (et rechargement au changement d'utilisateur)
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setEntries({})
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const { data, error } = await supabase
        .from('resource_progress')
        .select('resource_id, level_slug, opened_at, done_at')

      if (cancelled) return

      if (error) {
        // Table absente (migration non appliquée) ou réseau : on dégrade
        // silencieusement vers « aucune progression » plutôt que de casser la page.
        console.warn('[progress] lecture impossible :', error.message)
        setEntries({})
      } else {
        const next: ProgressMap = {}
        for (const row of data ?? []) {
          next[row.resource_id] = {
            resourceId: row.resource_id,
            levelSlug: row.level_slug,
            openedAt: row.opened_at,
            doneAt: row.done_at,
          }
        }
        setEntries(next)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const persist = useCallback(
    async (entry: ProgressEntry, previous: ProgressEntry | undefined) => {
      if (!user) return
      const { error } = await supabase.from('resource_progress').upsert(
        {
          user_id: user.id,
          resource_id: entry.resourceId,
          level_slug: entry.levelSlug,
          opened_at: entry.openedAt,
          done_at: entry.doneAt,
        },
        { onConflict: 'user_id,resource_id' },
      )
      if (error) {
        console.warn('[progress] écriture impossible :', error.message)
        // Retour à l'état précédent : la coche ne doit pas mentir.
        setEntries(current => {
          const next = { ...current }
          if (previous) next[entry.resourceId] = previous
          else delete next[entry.resourceId]
          return next
        })
      }
    },
    [user],
  )

  const markOpened = useCallback(
    (resourceId: string, levelSlug: string) => {
      if (!user) return
      const previous = entries[resourceId]
      if (previous?.openedAt) return // première ouverture déjà enregistrée

      const entry: ProgressEntry = {
        resourceId,
        levelSlug,
        openedAt: new Date().toISOString(),
        doneAt: previous?.doneAt ?? null,
      }
      setEntries(current => ({ ...current, [resourceId]: entry }))
      void persist(entry, previous)
    },
    [entries, persist, user],
  )

  const toggleDone = useCallback(
    (resourceId: string, levelSlug: string) => {
      if (!user) return
      const previous = entries[resourceId]
      const entry: ProgressEntry = {
        resourceId,
        levelSlug,
        openedAt: previous?.openedAt ?? new Date().toISOString(),
        doneAt: previous?.doneAt ? null : new Date().toISOString(),
      }
      setEntries(current => ({ ...current, [resourceId]: entry }))
      void persist(entry, previous)
    },
    [entries, persist, user],
  )

  const value = useMemo<ProgressContextValue>(() => {
    const list = Object.values(entries)
    const done = list.filter(e => e.doneAt)
    const resumable = list
      .filter(e => e.openedAt && !e.doneAt)
      .sort((a, b) => (b.openedAt ?? '').localeCompare(a.openedAt ?? ''))

    return {
      entries,
      isLoading,
      markOpened,
      toggleDone,
      doneCountForLevel: (levelSlug: string) =>
        done.filter(e => e.levelSlug === levelSlug).length,
      totalDone: done.length,
      lastOpened: resumable[0] ?? null,
    }
  }, [entries, isLoading, markOpened, toggleDone])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress doit être utilisé à l’intérieur de <ProgressProvider>')
  }
  return context
}

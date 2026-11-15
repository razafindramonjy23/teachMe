'use client'

/**
 * Charge apprenants et progression pour l'espace d'administration (vue
 * d'ensemble, suivi). La visibilité par organisation est appliquée par la base
 * (RLS, migration 0005) : un admin rattaché ne reçoit que son organisation.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchPaged } from '@/lib/supabase/fetch-paged'
import { LEVELS, COURSES } from '@/lib/catalog'
import { levelResourceIds } from '@/lib/resources'
import { summarizeStudents, type StudentSummary, type ProgressRow, type CatalogLevel } from '@/lib/suivi'

type ProfileRow = {
  id: string
  display_name: string | null
  email: string | null
  matricule: string | null
  level: string | null
  /** Absent tant que la migration 0005 n'est pas appliquée. */
  organisation_id?: string | null
  created_at: string
  /** Absent tant que la migration 0005 n'est pas appliquée. */
  deactivated_at?: string | null
}

type ProgressDbRow = {
  user_id: string
  resource_id: string
  level_slug: string
  opened_at: string | null
  done_at: string | null
}

export type SuiviData = {
  loading: boolean
  error: string | null
  /** Apprenants actifs (les comptes désactivés sont écartés). */
  students: StudentSummary[]
  /** Lignes de progression de ces apprenants. */
  rows: ProgressRow[]
}

export function useSuiviData(enabled: boolean): SuiviData {
  const [data, setData] = useState<SuiviData>({ loading: true, error: null, students: [], rows: [] })

  useEffect(() => {
    if (!enabled) return
    let active = true
    ;(async () => {
      try {
        const [profiles, progress] = await Promise.all([
          // select('*') plutôt qu'une liste de colonnes : la requête fonctionne
          // avant comme après la migration 0005 (deactivated_at).
          fetchPaged<ProfileRow>((from, to) =>
            supabase.from('profiles').select('*').eq('user_type', 'student').order('id').range(from, to),
          ),
          fetchPaged<ProgressDbRow>((from, to) =>
            supabase
              .from('resource_progress')
              .select('user_id, resource_id, level_slug, opened_at, done_at')
              .order('user_id')
              .order('resource_id')
              .range(from, to),
          ),
        ])
        if (!active) return

        const students = profiles.filter(p => !p.deactivated_at)
        const ids = new Set(students.map(p => p.id))
        const rows: ProgressRow[] = progress
          .filter(r => ids.has(r.user_id))
          .map(r => ({
            userId: r.user_id,
            resourceId: r.resource_id,
            levelSlug: r.level_slug,
            openedAt: r.opened_at,
            doneAt: r.done_at,
          }))

        const catalog: CatalogLevel[] = [
          ...LEVELS.map(l => ({ slug: l.slug, name: l.name, code: l.code, kind: 'niveau' as const, ids: levelResourceIds(l.slug) })),
          ...COURSES.map(c => ({ slug: c.slug, name: c.name, code: c.code, kind: 'parcours' as const, ids: levelResourceIds(c.slug) })),
        ]
        const summaries = summarizeStudents(
          students.map(p => ({
            id: p.id,
            name: p.display_name ?? p.matricule ?? p.email ?? 'Apprenant',
            matricule: p.matricule,
            organisationId: p.organisation_id ?? null,
            level: p.level,
            createdAt: p.created_at,
          })),
          rows,
          catalog,
        )
        setData({ loading: false, error: null, students: summaries, rows })
      } catch (e) {
        if (active) setData({ loading: false, error: e instanceof Error ? e.message : 'Erreur de chargement', students: [], rows: [] })
      }
    })()
    return () => {
      active = false
    }
  }, [enabled])

  return data
}

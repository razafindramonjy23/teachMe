'use client'

/**
 * Organisations visibles par l'administrateur connecté (RLS, migration 0005) :
 * toutes pour un superuser ou un admin global, la sienne seule pour un admin
 * rattaché. Chargées une fois par le layout d'administration et partagées
 * entre les onglets.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { organisationLabel, type Organisation } from '@/lib/organisations'

type OrganisationsState = {
  loading: boolean
  /** Message d'erreur (migration 0005 absente, réseau…), sinon null. */
  error: string | null
  list: Organisation[]
  byId: Map<string, Organisation>
  /** Libellé d'un identifiant : « Nom — Lieu », ou `empty` si null/inconnu. */
  label: (id: string | null | undefined, empty?: string) => string
  reload: () => Promise<void>
}

const OrganisationsContext = createContext<OrganisationsState | null>(null)

export function OrganisationsProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const { data, error: err } = await supabase.from('organisations').select('id, name, place').order('name')
    if (err) setError(err.message)
    else {
      setError(null)
      setList((data ?? []) as Organisation[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo<OrganisationsState>(() => {
    const byId = new Map(list.map(o => [o.id, o]))
    return {
      loading,
      error,
      list,
      byId,
      label: (id, empty = 'Aucune organisation') => (id ? organisationLabel(byId.get(id), 'Organisation inconnue') : empty),
      reload,
    }
  }, [list, loading, error, reload])

  return <OrganisationsContext.Provider value={value}>{children}</OrganisationsContext.Provider>
}

export function useOrganisations(): OrganisationsState {
  const ctx = useContext(OrganisationsContext)
  if (!ctx) throw new Error('useOrganisations doit être utilisé dans <OrganisationsProvider>')
  return ctx
}

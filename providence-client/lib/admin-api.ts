'use client'

/**
 * Appels de l'interface d'administration vers les routes /api. Chaque route
 * revérifie elle-même les droits (rôle + organisation) : l'interface ne fait que
 * masquer ce qui serait refusé.
 */

import { authFetch } from '@/lib/auth'
import type { ImportResult } from '@/lib/import'
import type { Organisation } from '@/lib/organisations'

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authFetch(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) throw new Error(data.message ?? `Erreur ${res.status}`)
  return data
}

const post = <T,>(path: string, body: unknown) => send<T>('POST', path, body)

export const adminApi = {
  /** Désactive (false) ou réactive (true) un compte ; la progression est conservée. */
  setActive: (id: string, active: boolean) => post<Record<string, unknown>>(`/api/users/manage/${id}/status`, { active }),

  /** Génère et applique un mot de passe provisoire, renvoyé une seule fois. */
  resetPassword: (id: string) => post<{ password: string }>(`/api/users/manage/${id}/reset-password`, {}),

  /** Crée un paquet d'apprenants (au plus IMPORT_BATCH_SIZE). */
  importBatch: (payload: { organisationId: string | null; level: string; students: { displayName: string }[] }) =>
    post<{ results: ImportResult[] }>('/api/users/import', payload),

  /** Organisations (superuser seulement, revérifié côté serveur). */
  createOrganisation: (payload: { name: string; place: string }) =>
    send<Organisation>('POST', '/api/organisations', payload),
  updateOrganisation: (id: string, payload: { name: string; place: string }) =>
    send<Organisation>('PATCH', `/api/organisations/${id}`, payload),
  deleteOrganisation: (id: string) => send<Record<string, never>>('DELETE', `/api/organisations/${id}`),
}

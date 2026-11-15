/**
 * Organisations — fonctions pures partagées par l'interface et l'API,
 * testées dans tests/organisations.test.ts.
 */

export type Organisation = { id: string; name: string; place: string | null }

export const ORG_NAME_MAX = 120

type Cleaned = { ok: true; name: string; place: string | null } | { ok: false; message: string }

/** Valide et normalise une saisie { name, place } (espaces superflus retirés). */
export function cleanOrganisationInput(raw: unknown): Cleaned {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as { name?: unknown; place?: unknown }
  const name = typeof obj.name === 'string' ? obj.name.replace(/\s+/g, ' ').trim() : ''
  const placeRaw = typeof obj.place === 'string' ? obj.place.replace(/\s+/g, ' ').trim() : ''
  if (!name) return { ok: false, message: 'Le nom de l’organisation est requis' }
  if (name.length > ORG_NAME_MAX) return { ok: false, message: `Nom trop long (${ORG_NAME_MAX} caractères au plus)` }
  if (placeRaw.length > ORG_NAME_MAX) return { ok: false, message: `Lieu trop long (${ORG_NAME_MAX} caractères au plus)` }
  return { ok: true, name, place: placeRaw || null }
}

/** Libellé d'affichage : « Nom — Lieu », ou « Aucune organisation ». */
export function organisationLabel(org: Organisation | null | undefined, empty = 'Aucune organisation'): string {
  if (!org) return empty
  return org.place ? `${org.name} — ${org.place}` : org.name
}

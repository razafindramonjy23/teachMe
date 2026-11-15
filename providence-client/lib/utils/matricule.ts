/**
 * Matricules des apprenants — l'identifiant de connexion de ceux qui n'ont pas
 * d'email.
 *
 * Les matricules sont générés par la base (fonction next_learner_matricule,
 * migration 0005), jamais dans le navigateur. Ce module ne fait que reconnaître
 * et normaliser ce que l'apprenant tape à la connexion.
 *
 * Deux formats coexistent :
 *   - actuel  : TM-000123            (sans lieu : teachMe est ouvert à tous, partout)
 *   - ancien  : PA-010-STU-2611-0001 (comptes créés avant les organisations,
 *               le site était inscrit dans le matricule) — toujours valables
 */

export const MATRICULE_EXAMPLE = 'TM-000123'

const CURRENT_FORMAT = /^TM-\d{6}$/
// Séquence sur 3 ou 4 chiffres : les deux ont existé
const LEGACY_FORMAT = /^PA-\d{3}-STU-\d{4}-\d{3,4}$/

/** Forme canonique : majuscules, sans espaces (un apprenant tape vite). */
export function normalizeMatricule(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

/** Format reconnu (actuel ou ancien) ? */
export function isValidMatricule(input: string): boolean {
  const m = normalizeMatricule(input)
  return CURRENT_FORMAT.test(m) || LEGACY_FORMAT.test(m)
}

export const USER_TYPE_LABELS = {
  student: 'Apprenant',
  staff: 'Personnel',
} as const

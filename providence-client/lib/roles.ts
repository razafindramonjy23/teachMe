/**
 * Règles d'habilitation — source unique, partagée par l'interface admin
 * (masquage des options) et par les routes API (refus 403).
 *
 * Module pur : aucune dépendance, importable côté client, côté serveur et
 * depuis les tests.
 */

export type UserRole = 'superuser' | 'admin' | 'user'
export type AdminRole = Extract<UserRole, 'admin' | 'superuser'>

/**
 * Seul un superuser peut créer, modifier, promouvoir ou supprimer un superuser.
 * Un admin gère les admins et les utilisateurs.
 */
export function canManageRole(callerRole: AdminRole, targetRole: UserRole): boolean {
  if (callerRole === 'superuser') return true
  return targetRole !== 'superuser'
}

/** Rôles qu'un appelant a le droit d'attribuer, dans l'ordre d'affichage. */
export function assignableRoles(callerRole: AdminRole): UserRole[] {
  return (['user', 'admin', 'superuser'] as const).filter(r => canManageRole(callerRole, r))
}

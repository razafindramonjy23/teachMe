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

/** L'appelant administrateur : son rôle, et son organisation de rattachement éventuelle. */
export type AdminCaller = { role: AdminRole; organisationId: string | null }

/** La cible d'une action d'administration. */
export type ManagedTarget = { role: UserRole; organisationId: string | null }

/**
 * Règle d'organisation, identique à la fonction SQL `can_oversee`
 * (migration 0005) : un superuser et un admin sans organisation voient tout le
 * monde ; un admin rattaché ne voit que les membres de son organisation.
 */
export function canOverseeOrg(caller: AdminCaller, targetOrganisationId: string | null): boolean {
  if (caller.role === 'superuser' || caller.organisationId === null) return true
  return targetOrganisationId === caller.organisationId
}

/** Peut-on agir sur ce compte ? Règle de rôle ET règle d'organisation. */
export function canActOn(caller: AdminCaller, target: ManagedTarget): boolean {
  return canManageRole(caller.role, target.role) && canOverseeOrg(caller, target.organisationId)
}

/**
 * Organisation imposée à un compte créé par cet appelant : un admin rattaché
 * ne crée que dans son organisation ; sinon, celle demandée (ou aucune).
 */
export function enforcedOrganisation(caller: AdminCaller, requested: string | null): string | null {
  if (caller.role !== 'superuser' && caller.organisationId !== null) return caller.organisationId
  return requested
}

/** Seul le superuser supprime définitivement un compte (la progression part avec). */
export function canDeletePermanently(caller: AdminCaller): boolean {
  return caller.role === 'superuser'
}

/** Seul le superuser crée, renomme ou supprime une organisation. */
export function canManageOrganisations(caller: AdminCaller): boolean {
  return caller.role === 'superuser'
}

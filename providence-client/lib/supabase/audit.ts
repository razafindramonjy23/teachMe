import 'server-only';
import { supabaseAdmin } from './admin';
import type { AdminContext } from './require-admin';

export type AuditAction =
  | 'create'
  | 'import'
  | 'update'
  | 'deactivate'
  | 'reactivate'
  | 'reset_password'
  | 'delete'
  | 'org_create'
  | 'org_update'
  | 'org_delete';

/**
 * Inscrit une action d'administration au journal (table admin_audit,
 * migration 0005), lisible par les seuls superusers.
 *
 * Ne journalise JAMAIS un mot de passe, même provisoire : seulement le fait
 * qu'il a changé.
 *
 * Volontairement non bloquant : si l'écriture échoue (migration 0005 absente,
 * réseau), l'action d'administration elle-même n'est pas annulée — mais
 * l'échec est tracé dans les journaux du serveur.
 */
export async function logAdminAction(
  actor: AdminContext,
  action: AuditAction,
  target?: { id?: string | null; label?: string | null },
  details: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabaseAdmin.from('admin_audit').insert({
    actor_id: actor.caller.id,
    actor_label: actor.label,
    action,
    target_id: target?.id ?? null,
    target_label: target?.label ?? null,
    details,
  });
  if (error) {
    console.error(`[audit] action « ${action} » non journalisée :`, error.message);
  }
}

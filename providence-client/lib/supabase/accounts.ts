import 'server-only';
import { supabaseAdmin } from './admin';
import type { UserRole } from '@/lib/roles';

export type NewAccount = {
  displayName: string;
  password: string;
  role: UserRole;
  userType: 'student' | 'staff';
  level: string;
  /** Organisation de rattachement, ou null (apprenant individuel, admin global). */
  organisationId: string | null;
  /** Obligatoire pour le personnel ; généré depuis le matricule pour un apprenant. */
  email?: string | null;
};

export type CreatedAccount =
  | { ok: true; profile: Record<string, unknown>; id: string; matricule: string | null }
  | { ok: false; status: number; message: string };

/** L'organisation existe-t-elle ? (null = aucune, toujours valable) */
export async function organisationExists(id: string | null): Promise<boolean> {
  if (id === null) return true;
  const { data } = await supabaseAdmin.from('organisations').select('id').eq('id', id).maybeSingle();
  return !!data;
}

/**
 * Crée un compte complet : matricule (apprenant), compte d'authentification,
 * puis rôle et organisation. Utilisé par la création unitaire et par l'import,
 * pour qu'il n'existe qu'une seule façon de créer un compte.
 */
export async function createAccount(input: NewAccount): Promise<CreatedAccount> {
  const displayName = input.displayName.trim();
  if (!displayName) return { ok: false, status: 400, message: 'Nom requis' };
  if (!input.password.trim()) return { ok: false, status: 400, message: 'Mot de passe requis' };

  let email = input.email?.trim() || undefined;
  let matricule: string | null = null;

  if (input.userType === 'staff') {
    if (!email) return { ok: false, status: 400, message: 'Email requis pour le personnel' };
  } else {
    // Matricule général (TM-000123), tiré d'une séquence : unique même en parallèle.
    const { data: next, error } = await supabaseAdmin.rpc('next_learner_matricule');
    if (error || !next) return { ok: false, status: 500, message: 'Erreur génération du matricule (migration 0005 appliquée ?)' };
    matricule = next as string;
    if (!email) email = `${matricule.toLowerCase()}@learner.teachme.local`;
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password.trim(),
    email_confirm: true,
    user_metadata: { displayName, userType: input.userType, level: input.level, matricule },
  });
  if (createError || !created.user) {
    const message = createError?.message ?? 'Erreur création utilisateur';
    return { ok: false, status: /already|duplicate/i.test(message) ? 400 : 500, message };
  }

  // Le trigger handle_new_user a créé le profil ; on pose le rôle choisi et
  // l'organisation. Un apprenant n'a plus rien à compléter.
  const { data: profile, error: roleError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: input.role,
      organisation_id: input.organisationId,
      ...(input.userType === 'student' ? { profile_complete: 100 } : {}),
    })
    .eq('id', created.user.id)
    .select()
    .single();
  if (roleError || !profile) return { ok: false, status: 500, message: "Erreur d'assignation du rôle" };

  return { ok: true, profile, id: created.user.id, matricule };
}

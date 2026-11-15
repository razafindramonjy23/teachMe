import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin, getManagedProfile, jsonError } from '@/lib/supabase/require-admin';
import { logAdminAction } from '@/lib/supabase/audit';
import { canActOn } from '@/lib/roles';

// Supabase n'a pas de bannissement « illimité » : 100 ans en tiennent lieu.
const BAN_FOREVER = '876000h';

/**
 * Désactive ou réactive un compte. Désactiver bloque la connexion (Supabase
 * Auth refuse le compte banni) et CONSERVE toute la progression, contrairement
 * à la suppression.
 *
 * Corps : { active: boolean }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { active } = (await request.json()) as { active?: unknown };
  if (typeof active !== 'boolean') return jsonError('Paramètre « active » attendu (true ou false)', 400);

  if (params.id === auth.caller.id) {
    return jsonError('Vous ne pouvez pas désactiver votre propre compte', 400);
  }

  const target = await getManagedProfile(params.id);
  if (!target) return jsonError('Utilisateur introuvable', 404);
  if (!canActOn(auth, target)) return jsonError('Action non autorisée sur ce compte', 403);

  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
    ban_duration: active ? 'none' : BAN_FOREVER,
  });
  if (banError) return jsonError(banError.message, 400);

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error || !profile) {
    // La connexion est déjà bloquée/débloquée côté Auth : on le signale clairement.
    return jsonError(
      `Statut de connexion mis à jour, mais pas l’affichage : ${error?.message ?? 'profil introuvable'}. La migration 0005 est-elle appliquée ?`,
      500,
    );
  }

  await logAdminAction(auth, active ? 'reactivate' : 'deactivate', { id: params.id, label: target.label });
  return NextResponse.json(profile);
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin, getManagedProfile, jsonError } from '@/lib/supabase/require-admin';
import { logAdminAction } from '@/lib/supabase/audit';
import { canActOn, canManageRole, canOverseeOrg, canDeletePermanently } from '@/lib/roles';
import { organisationExists } from '@/lib/supabase/accounts';

type PatchUserBody = {
  displayName?: string;
  email?: string;
  password?: string;
  role?: 'superuser' | 'admin' | 'user';
  userType?: 'student' | 'staff';
  level?: string;
  /** Organisation de rattachement (null = aucune). */
  organisationId?: string | null;
  matricule?: string;
  profileComplete?: number;
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = params;
  const body = (await request.json()) as PatchUserBody;

  const target = await getManagedProfile(id);
  if (!target) return jsonError('Utilisateur introuvable', 404);

  // Règle de rôle et règle d'organisation (un admin rattaché ne touche qu'à la sienne)
  if (!canManageRole(auth.role, target.role)) {
    return jsonError('Seul un super administrateur peut modifier un super administrateur', 403);
  }
  if (!canActOn(auth, target)) {
    return jsonError('Ce compte n’appartient pas à votre organisation', 403);
  }

  // Personne ne promeut au rang de superuser, sauf un superuser
  if (body.role !== undefined && !canManageRole(auth.role, body.role)) {
    return jsonError('Seul un super administrateur peut attribuer le rôle super administrateur', 403);
  }

  if (body.organisationId !== undefined) {
    const nextOrg = body.organisationId || null;
    // Un admin rattaché ne déplace pas un compte vers une autre organisation
    if (!canOverseeOrg(auth, nextOrg)) {
      return jsonError('Vous ne pouvez rattacher un compte qu’à votre propre organisation', 403);
    }
    // L'organisation d'un admin définit ce qu'il voit : seul un superuser la
    // change (sinon un admin rattaché pourrait se « détacher » et tout voir).
    if (target.role === 'admin' && auth.role !== 'superuser' && nextOrg !== target.organisationId) {
      return jsonError('Seul un super administrateur peut changer l’organisation d’un administrateur', 403);
    }
    if (!(await organisationExists(nextOrg))) return jsonError('Organisation inconnue', 400);
  }

  if (body.password?.trim() || body.email?.trim()) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ...(body.password?.trim() ? { password: body.password.trim() } : {}),
      ...(body.email?.trim() ? { email: body.email.trim() } : {}),
    });
    if (authError) return jsonError(authError.message, 400);
  }

  const profileUpdate: Record<string, unknown> = {};
  if (body.displayName !== undefined) profileUpdate.display_name = body.displayName;
  if (body.email !== undefined) profileUpdate.email = body.email;
  if (body.role !== undefined) profileUpdate.role = body.role;
  if (body.userType !== undefined) profileUpdate.user_type = body.userType;
  if (body.level !== undefined) profileUpdate.level = body.level;
  if (body.organisationId !== undefined) profileUpdate.organisation_id = body.organisationId || null;
  if (body.matricule !== undefined) profileUpdate.matricule = body.matricule;
  if (body.profileComplete !== undefined) profileUpdate.profile_complete = body.profileComplete;

  const query = supabaseAdmin.from('profiles');
  const { data: profile, error: profileError } =
    Object.keys(profileUpdate).length > 0
      ? await query.update(profileUpdate).eq('id', id).select().single()
      : await query.select().eq('id', id).single();

  if (profileError || !profile) {
    return jsonError(profileError?.message ?? 'Utilisateur introuvable', 404);
  }

  // Journal : quels champs ont changé — jamais la valeur d'un mot de passe
  const changed = Object.keys(profileUpdate);
  if (body.password?.trim()) changed.push('password');
  if (changed.length > 0) {
    await logAdminAction(auth, 'update', { id, label: target.label }, {
      fields: changed,
      ...(body.role !== undefined && body.role !== target.role ? { role: { from: target.role, to: body.role } } : {}),
      ...(body.organisationId !== undefined && (body.organisationId || null) !== target.organisationId
        ? { organisation: { from: target.organisationId, to: body.organisationId || null } }
        : {}),
    });
  }

  return NextResponse.json(profile);
}

/**
 * Suppression DÉFINITIVE : efface aussi toute la progression (cascade).
 * Réservée au superuser ; un admin désactive le compte à la place
 * (POST /api/users/manage/[id]/status).
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  if (!canDeletePermanently(auth)) {
    return jsonError('Seul un super administrateur peut supprimer définitivement un compte. Désactivez-le plutôt.', 403);
  }
  if (params.id === auth.caller.id) {
    return jsonError('Vous ne pouvez pas supprimer votre propre compte', 400);
  }

  const target = await getManagedProfile(params.id);
  if (!target) return jsonError('Utilisateur introuvable', 404);
  if (!canActOn(auth, target)) return jsonError('Action non autorisée sur ce compte', 403);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);
  if (error) return jsonError(error.message, 400);

  await logAdminAction(auth, 'delete', { id: params.id, label: target.label }, { role: target.role, organisationId: target.organisationId });
  return new NextResponse(null, { status: 204 });
}

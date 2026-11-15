import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  requireAdmin,
  RequireAdminError,
  canManageRole,
  getManagedProfile,
} from '@/lib/supabase/require-admin';

type PatchUserBody = {
  displayName?: string;
  email?: string;
  password?: string;
  role?: 'superuser' | 'admin' | 'user';
  userType?: 'student' | 'staff';
  level?: string;
  location?: string;
  courseLevel?: string;
  matricule?: string;
  profileComplete?: number;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let callerRole: 'admin' | 'superuser';
  try {
    ({ role: callerRole } = await requireAdmin(request));
  } catch (e) {
    if (e instanceof RequireAdminError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id } = params;
  const body = (await request.json()) as PatchUserBody;

  const target = await getManagedProfile(id);
  if (!target) {
    return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
  }

  // Un admin ne modifie pas un super administrateur…
  if (!canManageRole(callerRole, target.role)) {
    return NextResponse.json(
      { message: 'Seul un super administrateur peut modifier un super administrateur' },
      { status: 403 },
    );
  }

  // …ni ne promeut qui que ce soit (lui-même compris) à ce rôle.
  if (body.role !== undefined && !canManageRole(callerRole, body.role)) {
    return NextResponse.json(
      { message: 'Seul un super administrateur peut attribuer le rôle super administrateur' },
      { status: 403 },
    );
  }

  if (body.password?.trim() || body.email?.trim()) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      {
        ...(body.password?.trim() ? { password: body.password.trim() } : {}),
        ...(body.email?.trim() ? { email: body.email.trim() } : {}),
      },
    );
    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }
  }

  const profileUpdate: Record<string, unknown> = {};
  if (body.displayName !== undefined) profileUpdate.display_name = body.displayName;
  if (body.email !== undefined) profileUpdate.email = body.email;
  if (body.role !== undefined) profileUpdate.role = body.role;
  if (body.userType !== undefined) profileUpdate.user_type = body.userType;
  if (body.level !== undefined) profileUpdate.level = body.level;
  if (body.location !== undefined) profileUpdate.location = body.location;
  if (body.courseLevel !== undefined) profileUpdate.course_level = body.courseLevel;
  if (body.matricule !== undefined) profileUpdate.matricule = body.matricule;
  if (body.profileComplete !== undefined) {
    profileUpdate.profile_complete = body.profileComplete;
  }

  const query = supabaseAdmin.from('profiles');
  const { data: profile, error: profileError } = Object.keys(profileUpdate)
    .length > 0
    ? await query.update(profileUpdate).eq('id', id).select().single()
    : await query.select().eq('id', id).single();

  if (profileError || !profile) {
    return NextResponse.json(
      { message: profileError?.message ?? 'Utilisateur introuvable' },
      { status: 404 },
    );
  }

  return NextResponse.json(profile);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let callerRole: 'admin' | 'superuser';
  let callerId: string;
  try {
    const auth = await requireAdmin(request);
    callerRole = auth.role;
    callerId = auth.caller.id;
  } catch (e) {
    if (e instanceof RequireAdminError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    throw e;
  }

  if (params.id === callerId) {
    return NextResponse.json(
      { message: 'Vous ne pouvez pas supprimer votre propre compte' },
      { status: 400 },
    );
  }

  const target = await getManagedProfile(params.id);
  if (!target) {
    return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
  }

  if (!canManageRole(callerRole, target.role)) {
    return NextResponse.json(
      { message: 'Seul un super administrateur peut supprimer un super administrateur' },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}

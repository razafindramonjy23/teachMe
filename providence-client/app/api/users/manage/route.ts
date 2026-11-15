import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, jsonError } from '@/lib/supabase/require-admin';
import { createAccount, organisationExists } from '@/lib/supabase/accounts';
import { logAdminAction } from '@/lib/supabase/audit';
import { canManageRole, enforcedOrganisation } from '@/lib/roles';

type CreateUserBody = {
  email?: string;
  displayName: string;
  password?: string;
  role?: 'superuser' | 'admin' | 'user';
  userType?: 'student' | 'staff';
  level?: string;
  /** Organisation de rattachement (null ou absent = aucune). */
  organisationId?: string | null;
};

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as CreateUserBody;
  const userType = body.userType ?? 'staff';
  const role = body.role ?? 'user';

  // L'interface masque l'option « Super Admin » aux admins ; la règle doit
  // aussi tenir ici, sinon un appel direct à l'API contourne la restriction.
  if (!canManageRole(auth.role, role)) {
    return jsonError('Seul un super administrateur peut créer un super administrateur', 403);
  }

  // Un admin rattaché à une organisation crée toujours dans la sienne.
  const organisationId = enforcedOrganisation(auth, body.organisationId || null);
  if (!(await organisationExists(organisationId))) return jsonError('Organisation inconnue', 400);

  const result = await createAccount({
    displayName: body.displayName ?? '',
    password: body.password ?? '',
    role,
    userType,
    level: body.level ?? 'Beginner',
    organisationId,
    email: body.email,
  });
  if (!result.ok) return jsonError(result.message, result.status);

  await logAdminAction(
    auth,
    'create',
    { id: result.id, label: body.displayName },
    { role, userType, organisationId, matricule: result.matricule },
  );
  return NextResponse.json(result.profile, { status: 201 });
}

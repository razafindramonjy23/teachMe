import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  requireAdmin,
  RequireAdminError,
  canManageRole,
} from '@/lib/supabase/require-admin';

type CreateUserBody = {
  email?: string;
  displayName: string;
  password?: string;
  role?: 'superuser' | 'admin' | 'user';
  userType?: 'student' | 'staff';
  level?: string;
  location?: string;
  courseLevel?: string;
};

export async function POST(request: NextRequest) {
  let callerRole: 'admin' | 'superuser';
  try {
    ({ role: callerRole } = await requireAdmin(request));
  } catch (e) {
    if (e instanceof RequireAdminError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    throw e;
  }

  const body = (await request.json()) as CreateUserBody;
  const userType = body.userType ?? 'staff';
  const role = body.role ?? 'user';
  const level = body.level ?? 'Beginner';

  // L'interface masque l'option « Super Admin » aux admins ; la règle doit
  // aussi tenir ici, sinon un appel direct à l'API contourne la restriction.
  if (!canManageRole(callerRole, role)) {
    return NextResponse.json(
      { message: 'Seul un super administrateur peut créer un super administrateur' },
      { status: 403 },
    );
  }

  // Sans mot de passe, le compte est créé mais personne ne peut s'y connecter.
  if (!body.password?.trim()) {
    return NextResponse.json(
      { message: 'Mot de passe requis' },
      { status: 400 },
    );
  }

  let email = body.email?.trim() || undefined;
  let matricule: string | null = null;
  let location: string | null = null;
  let courseLevel: string | null = null;

  if (userType === 'staff') {
    if (!email) {
      return NextResponse.json(
        { message: 'Email requis pour le personnel' },
        { status: 400 },
      );
    }
    location = body.location?.trim() || null;
    courseLevel = body.courseLevel?.trim() || null;
  } else {
    const loc = body.location?.trim();
    const course = body.courseLevel?.trim();
    if (!loc || !course) {
      return NextResponse.json(
        { message: 'Localisation et niveau de cours requis pour un étudiant' },
        { status: 400 },
      );
    }
    const { data: nextMatricule, error: matriculeError } =
      await supabaseAdmin.rpc('next_matricule', { p_location: loc });
    if (matriculeError || !nextMatricule) {
      return NextResponse.json(
        { message: 'Erreur génération du matricule' },
        { status: 500 },
      );
    }
    matricule = nextMatricule as string;
    location = loc;
    courseLevel = course;
    if (!email) email = `${matricule}@student.local`;
  }

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: body.password?.trim() || undefined,
      email_confirm: true,
      user_metadata: {
        displayName: body.displayName,
        userType,
        level,
        location,
        courseLevel,
        matricule,
      },
    });

  if (createError || !created.user) {
    const message = createError?.message ?? 'Erreur création utilisateur';
    const status = /already|duplicate/i.test(message) ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }

  // Le trigger handle_new_user a créé la ligne profiles avec un rôle déduit
  // du bootstrap et profile_complete = 0 ; on applique ensuite le rôle choisi
  // par l'admin. Pour un étudiant, localisation et niveau de cours sont exigés
  // plus haut : le profil est donc complet, inutile de renvoyer l'étudiant vers
  // /dashboard/onboarding ressaisir ce que l'admin vient de remplir.
  const { data: profile, error: roleError } = await supabaseAdmin
    .from('profiles')
    .update(userType === 'student' ? { role, profile_complete: 100 } : { role })
    .eq('id', created.user.id)
    .select()
    .single();

  if (roleError || !profile) {
    return NextResponse.json(
      { message: "Erreur d'assignation du rôle" },
      { status: 500 },
    );
  }

  return NextResponse.json(profile, { status: 201 });
}

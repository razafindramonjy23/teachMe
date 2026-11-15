import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin, RequireAdminError } from '@/lib/supabase/require-admin';

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
  try {
    await requireAdmin(request);
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
  // du bootstrap ; on applique ensuite le rôle explicitement choisi par l'admin.
  const { data: profile, error: roleError } = await supabaseAdmin
    .from('profiles')
    .update({ role })
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

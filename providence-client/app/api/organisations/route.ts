import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin, jsonError } from '@/lib/supabase/require-admin';
import { logAdminAction } from '@/lib/supabase/audit';
import { canManageOrganisations } from '@/lib/roles';
import { cleanOrganisationInput } from '@/lib/organisations';

/** Crée une organisation (superuser). Corps : { name, place? } */
export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!canManageOrganisations(auth)) return jsonError('Seul un super administrateur gère les organisations', 403);

  const input = cleanOrganisationInput(await request.json());
  if (!input.ok) return jsonError(input.message, 400);

  const { data, error } = await supabaseAdmin
    .from('organisations')
    .insert({ name: input.name, place: input.place })
    .select()
    .single();
  if (error || !data) {
    const duplicate = error?.code === '23505';
    return jsonError(duplicate ? 'Une organisation porte déjà ce nom' : error?.message ?? 'Erreur', duplicate ? 409 : 500);
  }

  await logAdminAction(auth, 'org_create', { id: data.id, label: data.name }, { place: data.place });
  return NextResponse.json(data, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin, jsonError } from '@/lib/supabase/require-admin';
import { logAdminAction } from '@/lib/supabase/audit';
import { canManageOrganisations } from '@/lib/roles';
import { cleanOrganisationInput } from '@/lib/organisations';

async function current(id: string) {
  const { data } = await supabaseAdmin.from('organisations').select('id, name, place').eq('id', id).maybeSingle();
  return data as { id: string; name: string; place: string | null } | null;
}

/** Renomme une organisation ou change son lieu (superuser). */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!canManageOrganisations(auth)) return jsonError('Seul un super administrateur gère les organisations', 403);

  const before = await current(params.id);
  if (!before) return jsonError('Organisation introuvable', 404);
  const input = cleanOrganisationInput(await request.json());
  if (!input.ok) return jsonError(input.message, 400);

  const { data, error } = await supabaseAdmin
    .from('organisations')
    .update({ name: input.name, place: input.place })
    .eq('id', params.id)
    .select()
    .single();
  if (error || !data) {
    const duplicate = error?.code === '23505';
    return jsonError(duplicate ? 'Une organisation porte déjà ce nom' : error?.message ?? 'Erreur', duplicate ? 409 : 500);
  }

  await logAdminAction(auth, 'org_update', { id: data.id, label: data.name }, {
    ...(before.name !== data.name ? { name: { from: before.name, to: data.name } } : {}),
    ...(before.place !== data.place ? { place: { from: before.place, to: data.place } } : {}),
  });
  return NextResponse.json(data);
}

/**
 * Supprime une organisation VIDE (superuser). Une organisation qui a encore
 * des membres est refusée : il faut d'abord les rattacher ailleurs, pour que
 * personne ne se retrouve « détaché » sans que ce soit voulu.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!canManageOrganisations(auth)) return jsonError('Seul un super administrateur gère les organisations', 403);

  const before = await current(params.id);
  if (!before) return jsonError('Organisation introuvable', 404);

  const { count, error: countError } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', params.id);
  if (countError) return jsonError(countError.message, 500);
  if ((count ?? 0) > 0) {
    return jsonError(`Cette organisation a encore ${count} membre${count! > 1 ? 's' : ''} : rattachez-les ailleurs avant de la supprimer.`, 409);
  }

  const { error } = await supabaseAdmin.from('organisations').delete().eq('id', params.id);
  if (error) return jsonError(error.message, 500);

  await logAdminAction(auth, 'org_delete', { id: params.id, label: before.name });
  return new NextResponse(null, { status: 204 });
}

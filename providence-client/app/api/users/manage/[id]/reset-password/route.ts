import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin, getManagedProfile, jsonError } from '@/lib/supabase/require-admin';
import { logAdminAction } from '@/lib/supabase/audit';
import { canActOn } from '@/lib/roles';
import { generateTempPassword } from '@/lib/passwords';

/**
 * Génère un mot de passe provisoire, l'applique, et le renvoie UNE seule fois.
 * Les apprenants ont des adresses fictives (…@learner.teachme.local, …@student.local pour les anciens) : ils ne peuvent pas
 * recevoir d'email de récupération, c'est donc l'admin qui réinitialise.
 *
 * Le mot de passe n'est ni stocké ni journalisé.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const target = await getManagedProfile(params.id);
  if (!target) return jsonError('Utilisateur introuvable', 404);
  if (!canActOn(auth, target)) return jsonError('Action non autorisée sur ce compte', 403);

  const password = generateTempPassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, { password });
  if (error) return jsonError(error.message, 400);

  await logAdminAction(auth, 'reset_password', { id: params.id, label: target.label });
  return NextResponse.json({ password }, { headers: { 'Cache-Control': 'no-store' } });
}

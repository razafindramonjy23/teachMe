import 'server-only';
import { supabaseAdmin } from './admin';

export class RequireAdminError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Vérifie que le bearer token envoyé par le client correspond à un compte
 * admin/superuser. Lève RequireAdminError sinon (à catcher dans les route
 * handlers pour renvoyer la bonne réponse HTTP).
 */
export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new RequireAdminError(401, 'Authentification requise');
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new RequireAdminError(401, 'Session invalide');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile || !['admin', 'superuser'].includes(profile.role)) {
    throw new RequireAdminError(403, 'Accès réservé aux administrateurs');
  }

  return { caller: userData.user, role: profile.role as 'admin' | 'superuser' };
}

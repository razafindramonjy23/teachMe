import 'server-only';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from './admin';
import type { AdminCaller, AdminRole, UserRole } from '@/lib/roles';

export class RequireAdminError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type AdminContext = AdminCaller & {
  caller: User;
  /** Libellé lisible de l'appelant, pour le journal. */
  label: string;
};

function labelOf(p: { display_name?: string | null; email?: string | null; matricule?: string | null; id: string }) {
  return p.display_name || p.email || p.matricule || p.id;
}

/**
 * Vérifie que le bearer token envoyé par le client correspond à un compte
 * admin/superuser ACTIF. Lève RequireAdminError sinon.
 */
export async function requireAdmin(request: Request): Promise<AdminContext> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new RequireAdminError(401, 'Authentification requise');
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new RequireAdminError(401, 'Session invalide');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, organisation_id, display_name, email, matricule, deactivated_at')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile || !['admin', 'superuser'].includes(profile.role)) {
    throw new RequireAdminError(403, 'Accès réservé aux administrateurs');
  }
  if (profile.deactivated_at) {
    throw new RequireAdminError(403, 'Ce compte administrateur est désactivé');
  }

  return {
    caller: userData.user,
    role: profile.role as AdminRole,
    organisationId: (profile.organisation_id as string | null) ?? null,
    label: labelOf(profile),
  };
}

/**
 * Variante pour les route handlers : renvoie le contexte, ou directement la
 * réponse HTTP d'erreur à retourner.
 */
export async function authorizeAdmin(request: Request): Promise<AdminContext | NextResponse> {
  try {
    return await requireAdmin(request);
  } catch (e) {
    if (e instanceof RequireAdminError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }
    throw e;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export type { UserRole as ManagedRole } from '@/lib/roles';
export { canManageRole } from '@/lib/roles';

export type ManagedProfile = {
  id: string;
  role: UserRole;
  organisationId: string | null;
  userType: 'student' | 'staff';
  label: string;
  deactivatedAt: string | null;
};

/** Lit un compte géré. `null` s'il n'existe pas. */
export async function getManagedProfile(id: string): Promise<ManagedProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, organisation_id, user_type, display_name, email, matricule, deactivated_at')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id as string,
    role: data.role as UserRole,
    organisationId: (data.organisation_id as string | null) ?? null,
    userType: data.user_type as 'student' | 'staff',
    label: labelOf(data),
    deactivatedAt: (data.deactivated_at as string | null) ?? null,
  };
}

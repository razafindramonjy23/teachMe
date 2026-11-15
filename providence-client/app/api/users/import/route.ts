import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, jsonError } from '@/lib/supabase/require-admin';
import { createAccount, organisationExists } from '@/lib/supabase/accounts';
import { logAdminAction } from '@/lib/supabase/audit';
import { enforcedOrganisation } from '@/lib/roles';
import { generateTempPassword } from '@/lib/passwords';
import { LEVELS } from '@/lib/catalog';
import { IMPORT_BATCH_SIZE, type ImportResult } from '@/lib/import';

type ImportBody = {
  /** Organisation commune au paquet (null ou absent = aucune). */
  organisationId?: string | null;
  level?: string;
  students?: { displayName?: string }[];
};

/**
 * Crée un paquet d'apprenants (au plus IMPORT_BATCH_SIZE par appel) avec des
 * mots de passe provisoires, renvoyés UNE seule fois pour la fiche imprimable.
 * L'interface découpe la liste en paquets : une fonction serverless ne doit
 * pas dépasser son délai d'exécution (10 s sur l'offre gratuite de Vercel).
 */
export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as ImportBody;
  const students = Array.isArray(body.students) ? body.students : [];
  if (students.length === 0) return jsonError('Aucun apprenant à créer', 400);
  if (students.length > IMPORT_BATCH_SIZE) {
    return jsonError(`Au plus ${IMPORT_BATCH_SIZE} apprenants par envoi`, 400);
  }

  const organisationId = enforcedOrganisation(auth, body.organisationId || null);
  if (!(await organisationExists(organisationId))) return jsonError('Organisation inconnue', 400);
  const level = LEVELS.some(l => l.name === body.level) ? (body.level as string) : 'Beginner';

  const results: ImportResult[] = [];
  for (const s of students) {
    const displayName = (s.displayName ?? '').trim().slice(0, 100);
    if (!displayName) {
      results.push({ displayName: '', ok: false, message: 'Nom vide' });
      continue;
    }
    const password = generateTempPassword();
    const created = await createAccount({
      displayName,
      password,
      role: 'user',
      userType: 'student',
      level,
      organisationId,
    });
    if (!created.ok) {
      results.push({ displayName, ok: false, message: created.message });
      continue;
    }
    await logAdminAction(
      auth,
      'import',
      { id: created.id, label: displayName },
      { matricule: created.matricule, organisationId, level },
    );
    results.push({ displayName, ok: true, matricule: created.matricule, password });
  }

  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
}

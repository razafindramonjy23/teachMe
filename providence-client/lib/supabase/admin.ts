import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Client service_role — ne JAMAIS importer ce module depuis un composant
// client ('use client') ou l'exposer au navigateur. Réservé aux route
// handlers app/api/**/route.ts qui doivent créer/supprimer des comptes
// auth.users au nom d'un admin.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

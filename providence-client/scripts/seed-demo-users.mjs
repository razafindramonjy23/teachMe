// Recrée les comptes démo documentés dans GUIDE_LOGIN.md
// (Super Admin, Admin, Utilisateur démo) sur le projet Supabase configuré.
// Remplace GuideLoginDemoSeedService (qui tournait au démarrage de NestJS) —
// à lancer manuellement, une fois ou à chaque fois que vous voulez réinitialiser
// ces comptes.
//
// Usage :
//   SEED_SUPERUSER_PASSWORD='…' SEED_ADMIN_PASSWORD='…' SEED_DEMO_PASSWORD='…' \
//     node --env-file=.env.local scripts/seed-demo-users.mjs
//
// SÉCURITÉ — les mots de passe ne doivent JAMAIS être écrits dans ce fichier :
// le dépôt est public. Ils étaient auparavant codés en dur ici (et dans la
// doc), donc considérés comme compromis : changez-les dans Supabase.
// Un compte dont la variable n'est pas fournie est ignoré (ni créé, ni
// réinitialisé). Superuser et admin exigent au moins 12 caractères.

import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (voir .env.local).',
  );
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ACCOUNTS = [
  {
    email: 'superuser@providence.academy',
    password: process.env.SEED_SUPERUSER_PASSWORD,
    displayName: 'Super Admin',
    role: 'superuser',
  },
  {
    email: 'admin@providence.academy',
    password: process.env.SEED_ADMIN_PASSWORD,
    displayName: 'Admin Démo',
    role: 'admin',
  },
  {
    email: 'demo@providence.academy',
    password: process.env.SEED_DEMO_PASSWORD,
    displayName: 'Utilisateur Démo',
    role: 'user',
  },
];

async function findUserByEmail(email) {
  const perPage = 200;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
}

async function upsertDemoUser(account) {
  const existing = await findUserByEmail(account.email);
  const metadata = {
    displayName: account.displayName,
    userType: 'staff',
    level: 'Beginner',
  };

  let userId;
  if (existing) {
    userId = existing.id;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: account.password,
      user_metadata: metadata,
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: account.role,
      display_name: account.displayName,
      user_type: 'staff',
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  console.log(`✔ ${account.email} → ${account.role}`);
}

const MIN_LENGTH = { superuser: 12, admin: 12, user: 8 };
const ENV_NAME = { superuser: 'SEED_SUPERUSER_PASSWORD', admin: 'SEED_ADMIN_PASSWORD', user: 'SEED_DEMO_PASSWORD' };
// Empreintes SHA-256 des anciens mots de passe publiés dans ce dépôt public :
// refusés même si l'on tente de les réutiliser. On stocke l'empreinte plutôt
// que la valeur pour ne pas les republier dans un nouveau commit.
const COMPROMISED_SHA256 = new Set([
  '4e4c56e4a15f89f05c2f4c72613da2a18c9665d4f0d6acce16415eb06f9be776',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
]);
const isCompromised = (pwd) => COMPROMISED_SHA256.has(createHash('sha256').update(pwd).digest('hex'));

let done = 0;
for (const account of ACCOUNTS) {
  const env = ENV_NAME[account.role];
  if (!account.password) {
    console.log(`– ${account.email} ignoré (${env} non fourni)`);
    continue;
  }
  if (account.password.length < MIN_LENGTH[account.role] || isCompromised(account.password)) {
    console.error(
      `✘ ${account.email} : mot de passe refusé (${MIN_LENGTH[account.role]} caractères minimum, ` +
        `et pas une ancienne valeur publiée). Rien n'a été modifié pour ce compte.`,
    );
    process.exitCode = 1;
    continue;
  }
  await upsertDemoUser(account);
  done += 1;
}

console.log(`${done} compte(s) créé(s) ou réinitialisé(s).`);

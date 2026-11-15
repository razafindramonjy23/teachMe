// Recrée les comptes démo documentés dans GUIDE_LOGIN.md
// (Super Admin, Admin, Utilisateur démo) sur le projet Supabase configuré.
// Remplace GuideLoginDemoSeedService (qui tournait au démarrage de NestJS) —
// à lancer manuellement, une fois ou à chaque fois que vous voulez réinitialiser
// ces comptes.
//
// Usage : node --env-file=.env.local scripts/seed-demo-users.mjs

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
    password: 'super123',
    displayName: 'Super Admin',
    role: 'superuser',
  },
  {
    email: 'admin@providence.academy',
    password: 'admin123',
    displayName: 'Admin Démo',
    role: 'admin',
  },
  {
    email: 'demo@providence.academy',
    password: 'demo123',
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

for (const account of ACCOUNTS) {
  await upsertDemoUser(account);
}

console.log(
  'Comptes démo GUIDE_LOGIN.md prêts (superuser / admin / demo@providence.academy).',
);

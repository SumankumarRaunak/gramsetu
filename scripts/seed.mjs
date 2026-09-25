/*
 * Seed script: creates the System Admin and sample Authority accounts in
 * Supabase Auth, plus their profile rows (admins / authorities tables).
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env (never used in the browser).
 *
 * Run:  npm run seed
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('ERROR: VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const authorityUsers = [
  { email: 'panchayat.sachiv@sijoul.com', password: 'Authority@1234', fullName: 'Rameshwar Roy', phone: '9431543210' },
  { email: 'mukhiya.sijoul@sijoul.com', password: 'Authority@1234', fullName: 'Shailesh Prasad', phone: '9431543220' },
  { email: 'block.officer@sijoul.com', password: 'Authority@1234', fullName: 'Block Development Officer', phone: '9431543230' },
  { email: 'district.officer@sijoul.com', password: 'Authority@1234', fullName: 'District Magistrate', phone: '9431543250' },
];

const authoritiesProfiles = [
  { name: 'Rameshwar Roy', designation: 'Gram Panchayat Sachiv', role: 'PANCHAYAT', village: '', panchayat: '', block: '', district: '' },
  { name: 'Shailesh Prasad', designation: 'Mukhiya', role: 'MUKHIYA', village: '', panchayat: '', block: '', district: '' },
  { name: 'Block Development Officer', designation: 'BDO (Block Officer)', role: 'OFFICER', village: '', panchayat: '', block: '', district: '' },
  { name: 'District Magistrate', designation: 'DM (District Magistrate)', role: 'DEPARTMENT', village: '', panchayat: '', block: '', district: '' },
];

async function ensureAdmin() {
  console.log('\n--- System Admin ---');
  const { data: existing, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) throw listErr;

  const adminEmail = 'suman914294@gmail.com';
  const exists = existing.users.find((u) => u.email === adminEmail);

  let userId;
  if (exists) {
    userId = exists.id;
    console.log(`Already exists: ${adminEmail} (id ${userId})`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: 'Suman@123456',
      email_confirm: true,
      user_metadata: { full_name: 'Suman Kumar (S K Raunak)', role: 'admin' },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created: ${adminEmail} | password: Suman@123456`);
  }

  const { data: profile, error: profErr } = await admin
    .from('admins')
    .upsert(
      {
        id: userId,
        name: 'Suman Kumar (S K Raunak)',
        email: adminEmail,
        phone: '9142946979',
        role: 'super_admin',
      },
      { onConflict: 'id' }
    )
    .select('id');
  if (profErr) throw profErr;
  console.log(`Admin profile row ready: ${profile?.[0]?.id ?? userId}`);
}

async function ensureAuthorities() {
  console.log('\n--- Authorities ---');
  const { data: existing, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) throw listErr;

  for (let i = 0; i < authorityUsers.length; i++) {
    const u = authorityUsers[i];
    const p = authoritiesProfiles[i];

    const exists = existing.users.find((x) => x.email === u.email);
    let userId;
    if (exists) {
      userId = exists.id;
      console.log(`Already exists: ${u.email}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName, role: 'authority' },
      });
      if (error) throw error;
      userId = data.user.id;
      console.log(`Created: ${u.email} | password: ${u.password}`);
    }

    const { data: profile, error: profErr } = await admin
      .from('authorities')
      .upsert(
        {
          user_id: userId,
          name: p.name,
          designation: p.designation,
          role: p.role,
           email: u.email,
           phone: u.phone,
           village: p.village,
           panchayat: p.panchayat,
           block: p.block,
           district: p.district,
           is_active: true,
        },
        { onConflict: 'email' }
      )
      .select('id');
    if (profErr) throw profErr;
    console.log(`Authority profile ready: ${p.name} -> ${profile?.[0]?.id ?? 'n/a'}`);
  }
}

async function main() {
  await ensureAdmin();
  await ensureAuthorities();
  console.log('\nSeed complete. Login details:');
  console.log('  Admin     : suman914294@gmail.com / Suman@123456');
  console.log('  Authority : <any authority email above> / Authority@1234');
  console.log('Note: change passwords in Supabase Dashboard > Authentication > Users.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

// End-to-end verification of the grievance lifecycle against the live Supabase
// project, exactly like the SPA does: citizen submit -> admin verify -> official
// resolve (with a mandatory proof photo) -> citizen feedback -> admin reads it.
//
// Usage:
//   npm run e2e
//
// Requires .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY. Contact details for the seeded admin are read from
// this file's ADMIN_EMAIL/ADMIN_PASSWORD below.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error('Missing env keys (.env).');
  process.exit(1);
}

const ADMIN_EMAIL = 'suman914294@gmail.com';
const ADMIN_PASSWORD = 'Suman@123456';

const citizenEmail = `e2e.citizen.${Date.now()}@sijoul.test`;
const citizenPassword = 'E2e@Pass123';
const ID_BASE = 'E2E-';

const results = [];
const log = (name, ok, detail = '') =>
  results.push({ name, ok, detail: ok ? detail : `FAIL: ${detail}` });

const service = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

const run = async () => {
  // 1. Create a throwaway citizen (auth + profile row)
  let citizenId;
  try {
    const { data: au, error } = await service.auth.admin.createUser({
      email: citizenEmail,
      password: citizenPassword,
      email_confirm: true,
    });
    if (error) throw error;
    citizenId = au.user.id;
    const { error: e2 } = await service.from('users').insert({
      id: citizenId,
      full_name: 'E2E Test Citizen',
      email: citizenEmail,
      phone: '9000000000',
      village: 'E2E Village',
      ward: 'E2E Ward',
      block: 'E2E Block',
      district: 'Madhubani',
      panchayat: 'E2E Panchayat',
    });
    if (e2) throw e2;
    log('1. citizen auth + profile created', true, citizenEmail);
  } catch (err) {
    log('1. citizen auth + profile created', false, err.message);
    return finish();
  }

  // 2. Citizen signs in and submits a complaint
  let complaintId, cid;
  try {
    const { data: sess, error } = await anon.auth.signInWithPassword({
      email: citizenEmail,
      password: citizenPassword,
    });
    if (error) throw error;

    const { data: cats, error: ce } = await anon.from('categories').select('id,name').limit(1);
    if (ce) throw ce;
    const cat = cats && cats[0];

    const submitter = { submitter_name: 'E2E Test Citizen', submitter_mobile: '9000000000', submitter_email: citizenEmail };

    const { data: row, error: ie } = await anon
      .from('complaints')
      .insert({
        user_id: sess.user.id,
        category_id: cat?.id ?? null,
        category_name: cat?.name ?? '',
        title: `${ID_BASE}Street light flickering at E2E Ward`,
        description: 'Automated end-to-end verification complaint.',
        village: 'E2E Village',
        ward: 'E2E Ward',
        block: 'E2E Block',
        district: 'Madhubani',
        panchayat: 'E2E Panchayat',
        landmark: 'Near community pump',
        photo_url: '',
        priority: 'normal',
        ...submitter,
      })
      .select('id,complaint_id')
      .single();
    if (ie) throw ie;
    complaintId = row.id;
    cid = row.complaint_id;
    log('2. citizen submitted complaint', true, `${cid} (id=${complaintId})`);
  } catch (err) {
    log('2. citizen submitted complaint', false, err.message);
    return finish();
  }

  // 3. Admin verifies
  try {
    const { error } = await anon.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (error) throw error;
    const { error: ve } = await anon.rpc('verify_complaint', { p_complaint_id: complaintId });
    if (ve) throw ve;
    log('3. admin verified complaint', true);
  } catch (err) {
    log('3. admin verified complaint', false, err.message);
  }

  // 4. Mark RESOLVED WITHOUT a proof photo -> must be rejected by the RPC
  try {
    const { error } = await anon.rpc('update_complaint_status', {
      p_complaint_id: complaintId,
      p_status: 'RESOLVED',
      p_remarks: 'E2E attempt without photo',
      p_photo_url: '',
    });
    log('4. resolve-without-photo blocked', !!error, error ? error.message : '(DB not enforcing yet - re-run chunk 05)');
  } catch (err) {
    log('4. resolve-without-photo blocked', false, err.message);
  }

  // 5. Official resolves WITH a proof photo (uploaded file -> storage -> RPC)
  let proofPath;
  try {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    proofPath = `${citizenId}/e2e-proof.png`;
    const { error: ue } = await service.storage.from('complaints').upload(proofPath, png, {
      contentType: 'image/png',
      upsert: true,
    });
    if (ue) throw ue;

    const { error: se } = await anon.rpc('update_complaint_status', {
      p_complaint_id: complaintId,
      p_status: 'RESOLVED',
      p_remarks: 'E2E: replacement lamp installed and verified on site.',
      p_photo_url: proofPath,
    });
    if (se) throw se;
    log('5. resolved WITH photo proof', true, proofPath);
  } catch (err) {
    log('5. resolved WITH photo proof', false, err.message);
  }

  // 6. Citizen submits feedback
  try {
    const { error } = await anon.auth.signInWithPassword({ email: citizenEmail, password: citizenPassword });
    if (error) throw error;
    const { error: fe } = await anon.rpc('submit_feedback', {
      p_complaint_id: complaintId,
      p_rating: 5,
      p_comment: 'E2E: Light fixed within two days. Very satisfied.',
    });
    if (fe) throw fe;
    log('6. citizen feedback submitted', true, 'rating=5');
  } catch (err) {
    log('6. citizen feedback submitted', false, err.message);
  }

  // 7. Readback (service role = what the DB truly holds)
  try {
    const { data: c, error: ce } = await service
      .from('complaints')
      .select('status,resolved_at')
      .eq('id', complaintId)
      .single();
    if (ce) throw ce;

    const { data: f, error: fee } = await service
      .from('feedback')
      .select('rating,comment')
      .eq('complaint_id', complaintId)
      .single();
    if (fee) throw fee;

    const { data: st, error: ste } = await service
      .from('complaint_status')
      .select('status,photo_url,remarks')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (ste) throw ste;

    const ok = c.status === 'RESOLVED' && f.rating === 5 && st[0].status === 'RESOLVED' && !!st[0].photo_url;
    log('7. DB readback (status/feedback/proof)', ok, JSON.stringify({ status: c.status, resolved_at: c.resolved_at, feedback: f, latest: st[0] }));
  } catch (err) {
    log('7. DB readback (status/feedback/proof)', false, err.message);
  }

  // 8. Admin reads feedback through normal (anon, admin RLS) client
  try {
    const { error } = await anon.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (error) throw error;
    const { data, error: fe } = await anon.from('feedback').select('complaint_id,rating,comment').eq('complaint_id', complaintId);
    if (fe) throw fe;
    log('8. admin sees feedback (RLS)', (data || []).length === 1, JSON.stringify(data));
  } catch (err) {
    log('8. admin sees feedback (RLS)', false, err.message);
  }

  // 9. Public tracking endpoint returns the case (photo in timeline needs chunk 05 re-run)
  try {
    const { data, error } = await anon.auth.signOut().then(() =>
      createClient(URL, ANON, { auth: { persistSession: false } })
        .from('complaints')
        .select('complaint_id')
        .eq('complaint_id', cid)
        .maybeSingle()
    );
    if (error) throw error;
    const { data: st, error: ste } = await service
      .from('complaint_status')
      .select('status,photo_url')
      .eq('complaint_id', complaintId);
    if (ste) throw ste;
    const withPhoto = (st || []).find((s) => s.status === 'RESOLVED' && s.photo_url);
    log(
      '9. complaint reachable via public ID',
      !!data && !!withPhoto,
      withPhoto ? `RESOLVED + photo stored` : 'public row exists; photo in public timeline needs chunk 05 re-run'
    );
  } catch (err) {
    log('9. complaint reachable via public ID', false, err.message);
  }

  // Cleanup test citizen
  try {
    await service.auth.admin.deleteUser(citizenId);
  } catch {
    /* keep the row for debugging if cleanup fails */
  }

  finish();
};

const finish = () => {
  console.log('\n=== E2E VERIFY RESULTS ===');
  let allOk = true;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'WARN'}  ${r.name}${r.detail ? `\n      ${r.detail}` : ''}`);
    if (!r.ok) allOk = false;
  }
  console.log(`\n${allOk ? 'ALL STEPS PASSED' : 'FIRST FAILING STEP ABOVE MAY NEED THE CHUNK-05 RE-RUN'}`);
  process.exit(allOk ? 0 : 1);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
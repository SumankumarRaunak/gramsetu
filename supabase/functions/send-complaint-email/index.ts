// Supabase Edge Function: send-complaint-email
//
// Drains complaint_forwarding rows whose email_status = 'PENDING' and sends an
// acknowledgement email (SMTP_* secrets) to the forwarding recipient with the
// public tracking link. Marks each row SENT (or FAILED + error).
//
// Deploy:
//   supabase secrets set SMTP_HOST=smtp.example.com SMTP_PORT=587 SMTP_USER=user SMTP_PASS=pass SMTP_FROM=no-reply@example.com
//   supabase functions deploy send-complaint-email --no-verify-jwt
//
// Run once a minute via a cron service (or curl the URL), or attach a DB
// webhook / pg_net trigger at the project level.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as nodemailer from 'npm:nodemailer@6.9.16';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

const SMTP_HOST = Deno.env.get('SMTP_HOST');
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');
const SMTP_FROM = Deno.env.get('SMTP_FROM') || SMTP_USER || 'no-reply@village-swaraj.in';

interface ForwardingRow {
  id: number;
  complaint_id: number;
  forwarded_by_name: string;
  forwarded_to: string;
  forwarded_to_name: string;
  remarks: string;
  recipient_email: string;
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

Deno.serve(async (_req) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response('Missing SUPABASE_URL/SERVICE_ROLE_KEY env', { status: 500 });
  }
  if (!SMTP_HOST) {
    return new Response('Missing SMTP_* secrets; configure and redeploy', { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: pending, error: fetchError } = await supabase
    .from('complaint_forwarding')
    .select(
      'id,complaint_id,forwarded_by,forwarded_by_name,forwarded_to,forwarded_to_name,remarks,recipient_email'
    )
    .eq('email_status', 'PENDING')
    .limit(25);

  if (fetchError) {
    return new Response(fetchError.message, { status: 500 });
  }

  const rows = (pending as ForwardingRow[]) || [];
  let sent = 0;
  let failed = 0;

  for (const fwd of rows) {
    if (!fwd.recipient_email) {
      await supabase
        .from('complaint_forwarding')
        .update({ email_status: 'FAILED', email_errors: 'No recipient email on authority' })
        .eq('id', fwd.id);
      failed++;
      continue;
    }

    // Resolve complaint details for the email body.
    const { data: complaint } = await supabase
      .from('complaints')
      .select('id,complaint_id,title,category_name,village,created_at')
      .eq('id', fwd.complaint_id)
      .maybeSingle();

    const trackUrl = `${SUPABASE_URL.replace(/https?:\/\//, '')}/?complaint=${complaint?.complaint_id || fwd.complaint_id}`;

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: fwd.recipient_email,
        subject: `[Grievance ${complaint?.complaint_id || ''}] Complaint forwarded - ${fwd.forwarded_to_name}`,
        html: `
          <h2>Complaint Forwarded for Action</h2>
          <p>Dear <strong>${fwd.forwarded_to_name}</strong>,</p>
          <p>A citizen grievance has been forwarded to you for resolution under the 7-Day grievance redressal SLA.</p>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
            <tr><th align="left">Complaint ID</th><td>${complaint?.complaint_id || ''}</td></tr>
            <tr><th align="left">Title</th><td>${complaint?.title || ''}</td></tr>
            <tr><th align="left">Category</th><td>${complaint?.category_name || ''}</td></tr>
            <tr><th align="left">Village</th><td>${complaint?.village || ''}</td></tr>
            <tr><th align="left">Submitted</th><td>${complaint?.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : ''}</td></tr>
            <tr><th align="left">Forwarded By</th><td>${fwd.forwarded_by_name}</td></tr>
            <tr><th align="left">Remarks</th><td>${fwd.remarks || '-'}</td></tr>
          </table>
          <p>Track & act on this file: <a href="https://${trackUrl}">${trackUrl}</a></p>
          <p>If no action is taken within 7 days, the file auto-escalates.</p>
          <p style="color:#666;font-size:12px;">Public Grievance Redressal Portal | Panchayati Raj Department, Government of Bihar</p>
        `,
      });

      await supabase.from('complaint_forwarding').update({
        email_status: 'SENT',
        emailed_at: new Date().toISOString(),
        email_errors: null,
      }).eq('id', fwd.id);
      sent++;
    } catch (err) {
      await supabase.from('complaint_forwarding').update({
        email_status: 'FAILED',
        email_errors: err instanceof Error ? err.message : 'send failed',
      }).eq('id', fwd.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
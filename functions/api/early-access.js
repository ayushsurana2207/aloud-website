// POST /api/early-access  { email, website? }  ->  stores the email, sends a one-time thank-you mail.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: the "website" field is hidden from people, so only bots fill it. Pretend success.
  if (body?.website) return json({ ok: true });

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  let isNew;
  try {
    const { meta } = await env.DB
      .prepare('INSERT INTO early_access (email, user_agent) VALUES (?, ?) ON CONFLICT(email) DO NOTHING')
      .bind(email, (request.headers.get('user-agent') || '').slice(0, 500))
      .run();
    isNew = meta.changes > 0;
  } catch (err) {
    console.error('early_access insert failed', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }

  // Only the first signup gets mail, so the form can't be used to flood someone's inbox.
  // The email is already saved, so a mail failure is logged, not shown to the visitor.
  if (isNew) {
    try {
      await sendThankYou(env, email);
    } catch (err) {
      console.error('thank-you email failed', err);
    }
  }
  return json({ ok: true });
}

async function sendThankYou(env, to) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [to],
      reply_to: env.REPLY_TO || undefined,
      subject: 'Thanks for your interest in Aloud',
      text: TEXT,
      html: HTML,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const TEXT = `Hi,

Thanks for requesting early access to Aloud.

We're opening Aloud to a small group of professors first. We'll be in touch soon to hear about your course and help you set up your first spoken check.

If you'd like to tell us about your course now, just reply to this email.

Ayush
Aloud`;

const HTML = `<!doctype html><html><body style="margin:0;background:#F6F8F7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0E1312">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px">
<tr><td style="padding:32px 32px 8px;font-size:17px;font-weight:600">Aloud</td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6;color:#3D4644">
<p style="margin:0 0 16px;color:#0E1312;font-size:20px;font-weight:600;line-height:1.3">Thanks for requesting early access.</p>
<p style="margin:0 0 16px">We're opening Aloud to a small group of professors first. We'll be in touch soon to hear about your course and help you set up your first spoken check.</p>
<p style="margin:0 0 24px">If you'd like to tell us about your course now, just reply to this email.</p>
<p style="margin:0;color:#0E1312">Ayush<br><span style="color:#66706E">Aloud</span></p>
</td></tr></table>
</td></tr></table></body></html>`;

/* Soft-CTA endpoint: emails the sample diagnostic to the visitor and a
   notification to the founders. No database — the inbox is the record.
   Env (Vercel): SMTP_USER, SMTP_PASS (Gmail app password), NOTIFY_TO. */
const RATE = new Map(); // per-instance token bucket — good enough for this traffic

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { email, company_website, t } = req.body || {};

  // Honeypot filled or submitted in under 2s → pretend success, do nothing.
  if (company_website || (typeof t === 'number' && t < 2000)) {
    return res.status(200).json({ ok: true });
  }

  if (typeof email !== 'string' || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'invalid' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter((ts) => now - ts < 60_000);
  if (hits.length >= 5) return res.status(429).json({ error: 'rate' });
  hits.push(now);
  RATE.set(ip, hits);

  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: `IntegrateAI <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your sample diagnostic — IntegrateAI',
      text:
        'Thanks for asking to see a diagnostic.\n\n' +
        'Attached is a sample teardown of a fictional speciality roastery — ' +
        'what an operating brain finds in the first week, and what it does about it.\n\n' +
        'When you want the real thing for your business, it takes 30 minutes: ' +
        'https://cal.com/integrateai/diagnostic\n\n' +
        'Chad & Paul\nIntegrateAI — integrate-ai.uk',
      attachments: [{ filename: 'sample-diagnostic.pdf', path: process.cwd() + '/assets/sample-diagnostic.pdf' }],
    });
    await transport.sendMail({
      from: `IntegrateAI site <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_TO || process.env.SMTP_USER,
      subject: `Sample diagnostic requested: ${email}`,
      text: `${email} requested the sample diagnostic at ${new Date().toISOString()}.`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('diagnostic-sample send failed:', err.message);
    return res.status(502).json({ error: 'send' });
  }
};

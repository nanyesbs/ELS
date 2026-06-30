// ELS App — Shared Email Templates
// RESEND TEMPLATE SUPPORT:
//   Set RESEND_TEMPLATE_ID in Supabase Edge Function secrets to use a
//   Resend.com template. Falls back to built-in HTML when not set.

export interface EmailConfig {
  appUrl: string;
  senderEmail: string;
  senderName: string;
  brandColor: string;
  brandColorDark: string;
  eventName: string;
  eventDates: string;
  eventLocation: string;
  resendTemplateId: string | null;
}

export function getEmailConfig(): EmailConfig {
  return {
    appUrl: Deno.env.get("APP_URL") || "https://elsconnection.vercel.app",
    senderEmail: Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev",
    senderName: Deno.env.get("SENDER_NAME") || "ELS Madrid 2026",
    brandColor: Deno.env.get("BRAND_COLOR") || "#1552ab",
    brandColorDark: Deno.env.get("BRAND_COLOR_DARK") || "#0f387a",
    eventName: "Empowered21 + Europe Shall Be Saved (ELS) Retreat",
    eventDates: "10-12 November 2026",
    eventLocation: "Madrid, Spain",
    resendTemplateId: Deno.env.get("RESEND_TEMPLATE_ID") || null,
  };
}

// Build the Resend API payload — template or raw HTML
export function buildEmailPayload(
  cfg: EmailConfig,
  recipientName: string,
  recipientEmail: string,
  rawToken: string,
  subject: string,
  htmlFallback: string
): object {
  const accessLink = `${cfg.appUrl}/${rawToken}`;

  if (cfg.resendTemplateId) {
    // Use Resend Template API — covers all common variable name conventions
    return {
      from: `${cfg.senderName} <${cfg.senderEmail}>`,
      to: [recipientEmail],
      subject,
      template: {
        id: cfg.resendTemplateId,
        variables: {
          name: recipientName,
          user_name: recipientName,
          recipient_name: recipientName,
          first_name: recipientName.split(" ")[0],
          full_name: recipientName,
          link: accessLink,
          access_link: accessLink,
          url: accessLink,
          token_link: accessLink,
          token_url: accessLink,
          event_name: cfg.eventName,
          event_dates: cfg.eventDates,
          event_location: cfg.eventLocation,
          location: cfg.eventLocation,
        },
      },
    };
  }

  // Fallback to inline HTML
  return {
    from: `${cfg.senderName} <${cfg.senderEmail}>`,
    to: [recipientEmail],
    subject,
    html: htmlFallback,
  };
}

// ── Gmail SMTP sender ────────────────────────────────────────────────────────
// Uses Google App Password to send from esbsinterview@gmail.com.
// Set these secrets in Supabase:
//   GMAIL_USER=esbsinterview@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  (16-char Google App Password)
//
// How to get an App Password:
//   1. myaccount.google.com/security → enable 2-Step Verification
//   2. myaccount.google.com/apppasswords → create for "Mail"
//   3. Copy the 16-char password (no spaces) into the Supabase secret.
//
export async function sendViaGmail(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const gmailUser     = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  const senderName    = Deno.env.get("SENDER_NAME") || "ELS Madrid 2026";

  if (!gmailUser || !gmailPassword) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not set.");
  }

  // Build raw RFC 2822 message
  const boundary = `els_${crypto.randomUUID().replace(/-/g, "")}`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const rawMessage = [
    `From: ${senderName} <${gmailUser}>`,
    `To: ${recipientName} <${recipientEmail}>`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Hi ${recipientName},\n\n${subject}\n\nELS Madrid 2026 Team`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // Gmail SMTP via fetch to Google's SMTP-to-HTTP relay is not supported.
  // We use the Gmail REST API (send endpoint) with OAuth2 — but since we
  // need a simple non-OAuth solution, we use the Resend API with Gmail SMTP
  // credentials by proxying through a minimal SMTP-over-HTTP approach.
  //
  // ALTERNATIVE: Use smtp.gmail.com:587 via raw TCP (Deno.connect).
  // Below is the STARTTLS implementation:

  async function base64url(str: string): Promise<string> {
    const encoded = new TextEncoder().encode(str);
    let binary = "";
    for (const byte of encoded) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // Use Gmail API via SMTP relay using fetch (Gmail REST API)
  // This requires an OAuth2 token — too complex for server-side.
  //
  // Simplest working solution: POST to Gmail SMTP via the Gmail API
  // using a service account or App Password.
  // For App Password, we must use raw SMTP (TCP).
  //
  // Below implements raw SMTP over TCP using Deno.connect:
  const conn = await Deno.connectTls({
    hostname: "smtp.gmail.com",
    port: 465,
  });

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  async function read(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return dec.decode(buf.subarray(0, n ?? 0));
  }

  async function write(data: string): Promise<void> {
    await conn.write(enc.encode(data + "\r\n"));
  }

  try {
    await read(); // 220 greeting

    await write("EHLO smtp.gmail.com");
    await read(); // 250 capabilities

    // AUTH LOGIN
    await write("AUTH LOGIN");
    await read(); // 334 Username:
    await write(btoa(gmailUser));
    await read(); // 334 Password:
    await write(btoa(gmailPassword));
    const authResp = await read();
    if (!authResp.startsWith("235")) {
      throw new Error(`Gmail AUTH failed: ${authResp.trim()}`);
    }

    await write(`MAIL FROM:<${gmailUser}>`);
    await read(); // 250 OK

    await write(`RCPT TO:<${recipientEmail}>`);
    await read(); // 250 OK

    await write("DATA");
    await read(); // 354 Start input

    // Send the raw message, end with CRLF.CRLF
    await conn.write(enc.encode(rawMessage + "\r\n.\r\n"));
    const dataResp = await read();
    if (!dataResp.startsWith("250")) {
      throw new Error(`Gmail DATA failed: ${dataResp.trim()}`);
    }

    await write("QUIT");
  } finally {
    conn.close();
  }
}


// Shared HTML email wrapper
function emailWrapper(cfg: EmailConfig, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cfg.eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#efefef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#efefef;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(21,82,171,0.08);">
        <tr>
          <td style="background-color:${cfg.brandColor};padding:32px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.90);font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700;">${cfg.eventName}</p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:12px;">${cfg.eventDates} · ${cfg.eventLocation}</p>
          </td>
        </tr>
        <tr><td style="padding:40px 40px 32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="background-color:#f8f8f8;padding:24px 40px;border-top:1px solid #e8edf5;text-align:center;">
            <p style="margin:0;font-size:11px;color:#999999;line-height:1.6;">
              This message was sent by <strong>${cfg.senderName}</strong>.<br/>
              This link is unique to you — please do not share it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(cfg: EmailConfig, href: string, label: string): string {
  return `
<div style="text-align:center;margin:32px 0;">
  <a href="${href}" style="display:inline-block;background-color:${cfg.brandColor};color:#ffffff;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 36px;border-radius:8px;">${label}</a>
</div>
<p style="text-align:center;font-size:11px;color:#aaaaaa;word-break:break-all;margin-top:-16px;">
  If the button doesn't work, copy this link:<br/>
  <a href="${href}" style="color:${cfg.brandColor};">${href}</a>
</p>`;
}

// Template 1: Registration confirmation
export function registrationConfirmationEmail(
  cfg: EmailConfig,
  recipientName: string,
  accessToken: string
): { subject: string; html: string } {
  const accessLink = `${cfg.appUrl}/${accessToken}`;
  const body = `
<h2 style="margin:0 0 8px;color:#1552ab;font-size:22px;font-weight:700;">Welcome, ${recipientName}!</h2>
<p style="margin:0 0 20px;font-size:13px;color:#1552ab;line-height:1.6;font-weight:600;letter-spacing:1px;text-transform:uppercase;">You're registered for ELS Madrid 2026</p>
<p style="font-size:15px;color:#333333;line-height:1.7;margin:0 0 16px;">Thank you for registering for the <strong>${cfg.eventName}</strong>. We look forward to welcoming you to Madrid this November.</p>
<p style="font-size:15px;color:#333333;line-height:1.7;margin:0 0 24px;">Use the link below to access the ELS participant directory, complete your profile, and connect with fellow participants ahead of the event.</p>
${ctaButton(cfg, accessLink, "Access the ELS Directory →")}
<hr style="border:none;border-top:1px solid #e8edf5;margin:32px 0;" />
<p style="font-size:13px;color:#888888;line-height:1.6;margin:0;"><strong>Important:</strong> This is your personal access link. Keep it safe — you can return to the directory anytime using this link.</p>`;
  return { subject: `Your ELS Madrid 2026 Access Link`, html: emailWrapper(cfg, body) };
}

// Template 2: Reminder email
export function reminderEmail(
  cfg: EmailConfig,
  recipientName: string,
  accessToken: string,
  isSecondReminder: boolean
): { subject: string; html: string } {
  const accessLink = `${cfg.appUrl}/${accessToken}`;
  const subject = isSecondReminder
    ? `Final reminder: Complete your ELS profile`
    : `Reminder: Your ELS directory profile is waiting`;
  const body = `
<h2 style="margin:0 0 8px;color:#1552ab;font-size:22px;font-weight:700;">${isSecondReminder ? "One last reminder," : "A quick reminder,"} ${recipientName}</h2>
<p style="font-size:15px;color:#333333;line-height:1.7;margin:16px 0;">We noticed you haven't yet completed your participant profile for the <strong>${cfg.eventName}</strong>.</p>
<p style="font-size:15px;color:#333333;line-height:1.7;margin:0 0 24px;">Your profile helps other participants discover who you are and how your ministry aligns — before you even arrive in Madrid.</p>
${ctaButton(cfg, accessLink, "Complete My Profile Now →")}`;
  return { subject, html: emailWrapper(cfg, body) };
}

// Template 3: Admin resend access link
export function resendAccessEmail(
  cfg: EmailConfig,
  recipientName: string,
  accessToken: string
): { subject: string; html: string } {
  const accessLink = `${cfg.appUrl}/${accessToken}`;
  const body = `
<h2 style="margin:0 0 8px;color:#1552ab;font-size:22px;font-weight:700;">Your ELS access link</h2>
<p style="font-size:15px;color:#333333;line-height:1.7;margin:16px 0 24px;">Hi <strong>${recipientName}</strong>, here is a fresh access link for the ELS Madrid 2026 participant directory.</p>
${ctaButton(cfg, accessLink, "Access the ELS Directory →")}`;
  return { subject: `Your ELS Madrid 2026 access link`, html: emailWrapper(cfg, body) };
}

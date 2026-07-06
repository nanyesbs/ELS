import nodemailer from "npm:nodemailer@6.9.10";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  recipientName: string;
  rawToken: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPass = Deno.env.get("GMAIL_PASS");

  if (gmailUser && gmailPass) {
    console.log(`Sending email to ${options.to} via Gmail SMTP...`);
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"ELS Madrid 2026" <${gmailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`Gmail SMTP email successfully sent to ${options.to}`);
    return;
  }

  // Fallback to Resend API
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    const appUrl = Deno.env.get("APP_URL") || "https://elsconnection.vercel.app";
    console.warn(`[DEV] Neither GMAIL credentials nor RESEND_API_KEY set. Access link: ${appUrl}/${options.rawToken}`);
    return;
  }

  const resendTemplateId = Deno.env.get("RESEND_TEMPLATE_ID");
  const appUrl = Deno.env.get("APP_URL") || "https://elsconnection.vercel.app";
  const accessLink = `${appUrl}/${options.rawToken}`;
  const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
  const senderName = Deno.env.get("SENDER_NAME") || "ELS Madrid 2026";

  let payload: any = {
    from: `${senderName} <${senderEmail}>`,
    to: [options.to],
    subject: options.subject,
  };

  if (resendTemplateId) {
    payload.template = {
      id: resendTemplateId,
      variables: {
        name: options.recipientName,
        user_name: options.recipientName,
        recipient_name: options.recipientName,
        first_name: options.recipientName.split(" ")[0],
        full_name: options.recipientName,
        link: accessLink,
        access_link: accessLink,
        url: accessLink,
        token_link: accessLink,
        token_url: accessLink,
        event_name: "European Leaders Summit",
        event_dates: "10-12 November 2026",
        event_location: "Madrid, Spain",
        location: "Madrid, Spain",
      },
    };
  } else {
    payload.html = options.html;
  }

  console.log(`Sending email to ${options.to} via Resend...`);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error: ${errText}`);
  }

  console.log(`Resend email successfully sent to ${options.to}`);
}

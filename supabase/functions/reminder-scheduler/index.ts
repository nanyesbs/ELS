// ELS App — reminder-scheduler Edge Function
// Runs on a cron trigger (e.g., daily via pg_cron or Vercel cron).
// Finds participants who signed up but haven't completed their bio,
// rotates their token, and sends a reminder email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import {
  getEmailConfig,
  buildEmailPayload,
  reminderEmail,
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authorization: require CRON_SECRET if set
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 3-day reminder: reminder_sent_count = 0, registered 3+ days ago
    const { data: firstReminders, error: err1 } = await supabase
      .from("participants")
      .select("id, email, registered_name, reminder_sent_count")
      .eq("status", "registered")
      .eq("reminder_sent_count", 0)
      .lte("created_at", threeDaysAgo.toISOString());

    if (err1) throw err1;

    // 7-day reminder: reminder_sent_count = 1, registered 7+ days ago
    const { data: secondReminders, error: err2 } = await supabase
      .from("participants")
      .select("id, email, registered_name, reminder_sent_count")
      .eq("status", "registered")
      .eq("reminder_sent_count", 1)
      .lte("created_at", sevenDaysAgo.toISOString());

    if (err2) throw err2;

    const candidates = [
      ...(firstReminders || []),
      ...(secondReminders || []),
    ];

    console.log(
      `Reminder candidates: ${candidates.length} (3-day: ${firstReminders?.length ?? 0}, 7-day: ${secondReminders?.length ?? 0})`
    );

    const cfg = getEmailConfig();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let successCount = 0;

    for (const participant of candidates) {
      // Rotate token
      const rawToken = crypto.randomUUID();
      const tokenHash = await sha256(rawToken);
      const nextCount = (participant.reminder_sent_count ?? 0) + 1;
      const isSecond = nextCount > 1;

      const { error: updateError } = await supabase
        .from("participants")
        .update({
          token_hash: tokenHash,
          token_created_at: now.toISOString(),
          token_expires_at: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          reminder_sent_count: nextCount,
          last_reminder_sent_at: now.toISOString(),
        })
        .eq("id", participant.id);

      if (updateError) {
        console.error(
          `Token rotation failed for ${participant.id}:`,
          updateError
        );
        continue;
      }

      // Send reminder email
      if (resendApiKey) {
        const recipientName = participant.registered_name || "ELS Participant";
        const recipientEmail = participant.email;

        const { subject, html } = reminderEmail(
          cfg,
          recipientName,
          rawToken,
          isSecond
        );

        const payload = buildEmailPayload(
          cfg,
          recipientName,
          recipientEmail,
          rawToken,
          subject,
          html
        );

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`Email failed for ${recipientEmail}: ${errText}`);
        } else {
          successCount++;
          console.log(`Reminder sent to: ${recipientEmail}`);
        }
      } else {
        console.warn(
          `[DEV] RESEND_API_KEY not set. Access link: ${cfg.appUrl}/access?token=${rawToken}`
        );
        successCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        candidates: candidates.length,
        emailsSent: successCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("reminder-scheduler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

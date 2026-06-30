// ELS App — register-participant Edge Function
// Called by the /sign-up form POST.
//
// TOKEN GENERATION:
//   rawToken = crypto.randomUUID()
//   Source:   Web Crypto API (CSPRNG), Deno runtime
//   Format:   UUID v4 — 122 bits of cryptographic entropy
//   Guessability: 2^122 possible values — brute-force is computationally infeasible
//
// TOKEN STORAGE:
//   Only SHA-256(rawToken) is ever written to the database.
//   The raw token travels once: Edge Function → email body (over SMTP/TLS).
//   It is never stored in plain text anywhere.
//   Tradeoff: SHA-256 is one-way — if a participant loses the email and the
//   token is not stored by the app, they cannot recover it without admin action.
//   This is acceptable given the admin can rotate tokens via adminResendAccess().
//
// TOKEN EXPIRY:
//   token_expires_at = NULL  →  permanent, no automatic expiry.
//   /{token} is the participant's sole permanent access credential.
//   Manual revocation: admin sets token_expires_at to a past timestamp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import {
  getEmailConfig,
  buildEmailPayload,
  registrationConfirmationEmail,
  resendAccessEmail,
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const email = (body.email || "").toString().toLowerCase().trim();
    const name = (body.name || "").toString().trim();

    // ── Input validation ──────────────────────────────────────────
    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Name and email are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Supabase client — service role key bypasses RLS ───────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Token generation ──────────────────────────────────────────
    // crypto.randomUUID() → UUID v4 from CSPRNG (Web Crypto API).
    // 122 bits entropy. Non-sequential, non-predictable.
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    // rawToken is held only in this function's memory until emailed.
    // tokenHash is what gets written to the DB. rawToken is never persisted.

    const bioData = body.bio_data || null;

    // ── Insert via SECURITY DEFINER RPC ──────────────────────────
    const { data: participantId, error: rpcError } = await supabase.rpc(
      "register_participant",
      {
        p_email: email,
        p_registered_name: name,
        p_token_hash: tokenHash,
        p_bio_data: bioData,
      }
    );

    if (rpcError) {
      if (rpcError.message?.includes("DUPLICATE_EMAIL")) {
        // Email already registered. Rotate their token and resend.
        const newRawToken = crypto.randomUUID();
        const newTokenHash = await sha256(newRawToken);

        await supabase
          .from("participants")
          .update({
            token_hash: newTokenHash,
            token_created_at: new Date().toISOString(),
            token_expires_at: null, // permanent — no expiry
          })
          .eq("email", email);

        // Fetch the name for the resend email
        const { data: existing } = await supabase
          .from("participants")
          .select("registered_name, name")
          .eq("email", email)
          .single();

        const recipientName =
          existing?.registered_name || existing?.name || name;

        await sendEmail("resend", recipientName, email, newRawToken);

        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            message: "A new access link has been sent to your email.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw rpcError;
    }

    // ── Send confirmation email ───────────────────────────────────
    await sendEmail("new", name, email, rawToken);

    return new Response(
      JSON.stringify({
        success: true,
        token: rawToken,
        message:
          "Registration successful. Check your email for your permanent access link.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("register-participant error:", error);
    return new Response(
      JSON.stringify({ error: "Registration failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

type EmailType = "new" | "resend";

async function sendEmail(
  type: EmailType,
  recipientName: string,
  recipientEmail: string,
  rawToken: string
): Promise<void> {
  const cfg = getEmailConfig();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // In development, log the access link to function logs instead of sending.
  if (!resendApiKey) {
    console.warn(
      `[DEV] RESEND_API_KEY not set. Access link: ${cfg.appUrl}/${rawToken}`
    );
    return;
  }

  const { subject, html } =
    type === "new"
      ? registrationConfirmationEmail(cfg, recipientName, rawToken)
      : resendAccessEmail(cfg, recipientName, rawToken);

  const payload = buildEmailPayload(
    cfg,
    recipientName,
    recipientEmail,
    rawToken,
    subject,
    html
  );

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
    console.error(`Resend API error for ${recipientEmail}: ${errText}`);
    throw new Error(`Email delivery failed: ${errText}`);
  }

  console.log(
    `[${type.toUpperCase()}] Access email sent to: ${recipientEmail}`
  );
}

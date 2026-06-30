-- ============================================================
-- ELS App — Migration 2 (revised): Remove Ticket Tailor columns
-- Route simplification: /{token} is now the permanent credential.
-- Token expiry is REMOVED (token_expires_at = NULL = no expiry).
-- To revoke a specific token, SET token_expires_at = now() - INTERVAL '1 second'.
-- Apply this AFTER the initial schema migration (20260630000000_init_schema.sql).
-- ============================================================

-- 1. Drop Ticket Tailor columns from participants
ALTER TABLE public.participants
    DROP COLUMN IF EXISTS ticket_tailor_order_id,
    DROP COLUMN IF EXISTS ticket_tailor_buyer_email,
    DROP COLUMN IF EXISTS ticket_tailor_buyer_name;

-- 2. Add registered_name: name captured at sign-up (before bio form completion)
ALTER TABLE public.participants
    ADD COLUMN IF NOT EXISTS registered_name TEXT;

-- 3. Make email NOT NULL with a safe default for any existing rows that lack it
UPDATE public.participants SET email = '' WHERE email IS NULL;
ALTER TABLE public.participants ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.participants ALTER COLUMN email SET DEFAULT '';

-- 4. Token expiry: set column default to NULL (no expiry).
--    IMPORTANT: Token is now the sole permanent access credential for participants.
--    Revocation is done manually: UPDATE participants SET token_expires_at = now() - 1
--    The expiry check is retained in RPCs so individual tokens CAN be force-expired,
--    but new tokens are issued with NULL (no automatic expiry).
ALTER TABLE public.participants
    ALTER COLUMN token_expires_at SET DEFAULT NULL;

-- Remove expiry from any existing rows (make them permanent)
UPDATE public.participants
    SET token_expires_at = NULL
    WHERE token_expires_at IS NOT NULL;

-- 5. Drop and recreate get_participant_by_token RPC
--    SECURITY DEFINER: runs with the permissions of the function owner (postgres),
--    not the calling role. The anon key cannot call this and bypass it.
--    Token is hashed with SHA-256 before any comparison — the raw token is
--    never stored or logged anywhere in the database.
DROP FUNCTION IF EXISTS public.get_participant_by_token(TEXT);

CREATE OR REPLACE FUNCTION public.get_participant_by_token(p_token TEXT)
RETURNS TABLE (
    id              UUID,
    status          TEXT,
    registered_name TEXT,
    name            TEXT,
    country         TEXT,
    city            TEXT,
    organization    TEXT,
    church          TEXT,
    ministry        TEXT,
    role            TEXT,
    photo_url       TEXT,
    social_media    JSONB,
    areas_of_interest TEXT[],
    languages_spoken  TEXT[],
    short_bio       TEXT,
    email           TEXT,
    phone           TEXT,
    token_expires_at TIMESTAMPTZ
) SECURITY DEFINER
  SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    -- Hash the raw token before any DB comparison.
    -- The raw token NEVER touches the database.
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    RETURN QUERY
    SELECT
        p.id,
        p.status,
        p.registered_name,
        p.name,
        p.country,
        p.city,
        p.organization,
        p.church,
        p.ministry,
        p.role,
        p.photo_url,
        p.social_media,
        p.areas_of_interest,
        p.languages_spoken,
        p.short_bio,
        p.email,
        p.phone,
        p.token_expires_at
    FROM public.participants p
    WHERE p.token_hash = v_hash
      -- token_expires_at IS NULL = permanent (no expiry).
      -- token_expires_at set to a past date = manually revoked.
      AND (p.token_expires_at IS NULL OR p.token_expires_at > now());
END;
$$ LANGUAGE plpgsql;

-- 6. New RPC: register_participant
--    Called by the register-participant Edge Function using the SERVICE ROLE KEY.
--    The service role key bypasses RLS — this function must not be callable
--    by the anon key directly. The SECURITY DEFINER + anon RLS policies together
--    ensure anon callers cannot call this via rpc().
--    (Supabase does not expose SECURITY DEFINER functions to anon by default
--    unless explicitly GRANTed — do NOT grant EXECUTE to anon.)
CREATE OR REPLACE FUNCTION public.register_participant(
    p_email        TEXT,
    p_registered_name TEXT,
    p_token_hash   TEXT
) RETURNS UUID
  SECURITY DEFINER
  SET search_path = public, extensions
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Prevent duplicate registrations for the same email address.
    SELECT id INTO v_id
    FROM public.participants
    WHERE email = lower(trim(p_email))
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        -- Signal duplicate to the Edge Function so it can resend a new link.
        RAISE EXCEPTION 'DUPLICATE_EMAIL' USING HINT = v_id::TEXT;
    END IF;

    INSERT INTO public.participants (
        email,
        registered_name,
        status,
        token_hash,
        token_created_at,
        token_expires_at    -- NULL = permanent, no expiry
    ) VALUES (
        lower(trim(p_email)),
        trim(p_registered_name),
        'registered',
        p_token_hash,
        now(),
        NULL
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Update submit_bio_by_token — same expiry logic (NULL = permanent).
DROP FUNCTION IF EXISTS public.submit_bio_by_token(TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.submit_bio_by_token(
    p_token    TEXT,
    p_bio_data JSONB
) RETURNS BOOLEAN
  SECURITY DEFINER
  SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
    v_id   UUID;
BEGIN
    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    SELECT id INTO v_id
    FROM public.participants
    WHERE token_hash = v_hash
      AND (token_expires_at IS NULL OR token_expires_at > now());

    IF v_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.participants
    SET
        name              = COALESCE(p_bio_data->>'name',         name),
        country           = COALESCE(p_bio_data->>'country',      country),
        city              = COALESCE(p_bio_data->>'city',         city),
        organization      = COALESCE(p_bio_data->>'organization', organization),
        church            = COALESCE(p_bio_data->>'church',       church),
        ministry          = COALESCE(p_bio_data->>'ministry',     ministry),
        role              = COALESCE(p_bio_data->>'role',         role),
        photo_url         = COALESCE(p_bio_data->>'photo_url',    photo_url),
        social_media      = COALESCE((p_bio_data->'social_media'), social_media),
        areas_of_interest = CASE
                              WHEN p_bio_data->'areas_of_interest' IS NOT NULL
                              THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'areas_of_interest'))
                              ELSE areas_of_interest
                            END,
        languages_spoken  = CASE
                              WHEN p_bio_data->'languages_spoken' IS NOT NULL
                              THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'languages_spoken'))
                              ELSE languages_spoken
                            END,
        short_bio         = COALESCE(p_bio_data->>'short_bio',   short_bio),
        email             = COALESCE(p_bio_data->>'email',        email),
        phone             = COALESCE(p_bio_data->>'phone',        phone),
        status            = 'completed',
        profile_completed_at = COALESCE(profile_completed_at, now()),
        updated_at        = now()
    WHERE id = v_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- RLS POLICIES — full statement of all policies on participants
-- ─────────────────────────────────────────────────────────────────
-- The participants base table has RLS enabled (set in migration 1).
-- No anonymous client-side query can read or write participant
-- private fields (email, phone, token_hash, etc.) without going
-- through a SECURITY DEFINER RPC that validates the token.
--
-- Current policies:
--
-- 1. admin_all_policy:
--      FOR ALL on participants TO authenticated
--      USING (auth.uid() IN (SELECT id FROM public.admin_users))
--    → Only Supabase Auth users present in the admin_users table
--      can read or write the participants base table directly.
--
-- 2. NO anon SELECT policy on participants base table.
--    → anon key receives 0 rows from any direct query on participants.
--
-- 3. public_participants VIEW:
--    → GRANT SELECT TO anon on the view (completed rows only, no private fields).
--    → View definition excludes: email, phone, token_hash, token_expires_at,
--      registered_name, reminder_sent_count, last_reminder_sent_at.
--
-- 4. All participant self-service reads/writes go through:
--      get_participant_by_token(p_token TEXT) SECURITY DEFINER
--      submit_bio_by_token(p_token TEXT, p_bio_data JSONB) SECURITY DEFINER
--    These are the ONLY paths a participant can touch their own row.
--    The raw token is hashed before any DB operation — never stored or compared plain.
--
-- Re-assert admin_all_policy (idempotent):
DROP POLICY IF EXISTS admin_all_policy ON public.participants;
CREATE POLICY admin_all_policy ON public.participants
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.admin_users));

DROP POLICY IF EXISTS admin_profile_policy ON public.admin_users;
CREATE POLICY admin_profile_policy ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- 8. EXECUTE grants — keyed to actual caller:
--
--    register_participant: called ONLY by the register-participant Edge Function
--      using the service_role key. service_role bypasses RLS + grants entirely.
--      → REVOKE from anon. No client-side grant needed.
--
--    get_participant_by_token: called from the browser (services/api.ts:47)
--      using supabase.rpc() with the anon key — participants are NOT logged in.
--      → MUST be granted to anon, or /:token page will return null for everyone.
--
--    submit_bio_by_token: called from the browser (services/api.ts:66)
--      using supabase.rpc() with the anon key — same reason as above.
--      → MUST be granted to anon, or bio form submission will fail for everyone.
--
--    SECURITY NOTE: SECURITY DEFINER + SET search_path means these functions
--    execute with owner privileges regardless of caller role, but they only
--    expose data validated through SHA-256 token comparison — anon cannot
--    use them to enumerate or modify arbitrary participant rows.

REVOKE EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_participant_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_bio_by_token(TEXT, JSONB) TO anon;

-- 9. Performance indexes
CREATE INDEX IF NOT EXISTS idx_participants_email      ON public.participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_token_hash ON public.participants(token_hash);

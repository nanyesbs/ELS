-- ============================================================
-- ELS App — Migration 6: Update register_participant RPC
-- Updates register_participant to accept p_bio_data (4 parameters)
-- so it matches the Edge Function's call signature.
-- ============================================================

-- Drop the old 3-parameter function to avoid overloading confusion
DROP FUNCTION IF EXISTS public.register_participant(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.register_participant(TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.register_participant(
    p_email           TEXT,
    p_registered_name TEXT,
    p_token_hash      TEXT,
    p_bio_data        JSONB DEFAULT NULL
) RETURNS UUID
  SECURITY DEFINER
  SET search_path = public, extensions
AS $$
DECLARE
    v_id UUID;
    v_status TEXT := 'registered';
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

    -- If bio data is provided, set status to completed immediately
    IF p_bio_data IS NOT NULL AND p_bio_data != 'null'::jsonb THEN
        v_status := 'completed';
    END IF;

    INSERT INTO public.participants (
        email,
        registered_name,
        status,
        token_hash,
        token_created_at,
        token_expires_at,
        -- Bio fields
        name,
        country,
        nationality,
        short_bio,
        organization,
        role,
        role_tags,
        org_description,
        photo_url,
        promotional_picture_url,
        public_phone,
        public_email,
        public_website,
        public_other,
        areas_of_interest,
        testimony,
        upcoming_kingdom_events,
        dietary_restrictions
    ) VALUES (
        lower(trim(p_email)),
        trim(p_registered_name),
        v_status,
        p_token_hash,
        now(),
        NULL,
        -- Bio fields
        COALESCE(p_bio_data->>'name', trim(p_registered_name)),
        p_bio_data->>'country',
        p_bio_data->>'nationality',
        p_bio_data->>'short_bio',
        p_bio_data->>'organization',
        p_bio_data->>'role',
        CASE WHEN p_bio_data->'role_tags' IS NOT NULL AND p_bio_data->'role_tags' != 'null'::jsonb
             THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'role_tags'))
             ELSE NULL END,
        p_bio_data->>'org_description',
        p_bio_data->>'photo_url',
        p_bio_data->>'promotional_picture_url',
        p_bio_data->>'public_phone',
        p_bio_data->>'public_email',
        p_bio_data->>'public_website',
        p_bio_data->>'public_other',
        CASE WHEN p_bio_data->'areas_of_interest' IS NOT NULL AND p_bio_data->'areas_of_interest' != 'null'::jsonb
             THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'areas_of_interest'))
             ELSE NULL END,
        p_bio_data->>'testimony',
        p_bio_data->>'upcoming_kingdom_events',
        p_bio_data->>'dietary_restrictions'
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Revoke from public/anon, this is only called from Edge Function using service role key
REVOKE EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, JSONB) FROM anon, PUBLIC;

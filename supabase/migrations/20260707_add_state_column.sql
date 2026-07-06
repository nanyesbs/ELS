-- ============================================================
-- ELS App — Migration 7: Add State Column
-- Adds state column to participants and updates view & RPCs.
-- ============================================================

-- 1. Add state column
ALTER TABLE public.participants
    ADD COLUMN IF NOT EXISTS state TEXT;

-- 2. Update get_participant_by_token to return state
DROP FUNCTION IF EXISTS public.get_participant_by_token(TEXT);

CREATE OR REPLACE FUNCTION public.get_participant_by_token(p_token TEXT)
RETURNS TABLE (
    id                       UUID,
    status                   TEXT,
    registered_name          TEXT,
    name                     TEXT,
    country                  TEXT,
    state                    TEXT,
    city                     TEXT,
    nationality              TEXT,
    short_bio                TEXT,
    organization             TEXT,
    role                     TEXT,
    role_tags                TEXT[],
    org_description          TEXT,
    photo_url                TEXT,
    promotional_picture_url  TEXT,
    public_phone             TEXT,
    public_email             TEXT,
    public_website           TEXT,
    public_other             TEXT,
    areas_of_interest        TEXT[],
    testimony                TEXT,
    upcoming_kingdom_events  TEXT,
    dietary_restrictions     TEXT,
    church                   TEXT,
    ministry                 TEXT,
    languages_spoken         TEXT[],
    social_media             JSONB,
    email                    TEXT,
    phone                    TEXT,
    token_expires_at         TIMESTAMPTZ
) SECURITY DEFINER
  SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    v_hash := encode(digest(p_token, 'sha256'), 'hex');
    RETURN QUERY
    SELECT
        p.id, p.status, p.registered_name,
        p.name, p.country, p.state, p.city, p.nationality, p.short_bio,
        p.organization, p.role, p.role_tags, p.org_description,
        p.photo_url, p.promotional_picture_url,
        p.public_phone, p.public_email, p.public_website, p.public_other,
        p.areas_of_interest, p.testimony, p.upcoming_kingdom_events, p.dietary_restrictions,
        p.church, p.ministry, p.languages_spoken, p.social_media,
        p.email, p.phone, p.token_expires_at
    FROM public.participants p
    WHERE p.token_hash = v_hash
      AND (p.token_expires_at IS NULL OR p.token_expires_at > now());
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_participant_by_token(TEXT) TO anon;

-- 3. Update submit_bio_by_token to support state
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
    IF v_id IS NULL THEN RETURN FALSE; END IF;

    UPDATE public.participants SET
        name                    = COALESCE(p_bio_data->>'name',           name),
        country                 = COALESCE(p_bio_data->>'country',         country),
        state                   = COALESCE(p_bio_data->>'state',           state),
        city                    = COALESCE(p_bio_data->>'city',            city),
        nationality             = COALESCE(p_bio_data->>'nationality',     nationality),
        short_bio               = COALESCE(p_bio_data->>'short_bio',       short_bio),
        organization            = COALESCE(p_bio_data->>'organization',    organization),
        role                    = COALESCE(p_bio_data->>'role',            role),
        role_tags               = CASE WHEN p_bio_data->'role_tags' IS NOT NULL
                                  THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'role_tags'))
                                  ELSE role_tags END,
        org_description         = COALESCE(p_bio_data->>'org_description',        org_description),
        photo_url               = COALESCE(p_bio_data->>'photo_url',              photo_url),
        promotional_picture_url = COALESCE(p_bio_data->>'promotional_picture_url', promotional_picture_url),
        public_phone            = COALESCE(p_bio_data->>'public_phone',    public_phone),
        public_email            = COALESCE(p_bio_data->>'public_email',    public_email),
        public_website          = COALESCE(p_bio_data->>'public_website',  public_website),
        public_other            = COALESCE(p_bio_data->>'public_other',    public_other),
        areas_of_interest       = CASE WHEN p_bio_data->'areas_of_interest' IS NOT NULL
                                  THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'areas_of_interest'))
                                  ELSE areas_of_interest END,
        testimony               = COALESCE(p_bio_data->>'testimony',              testimony),
        upcoming_kingdom_events = COALESCE(p_bio_data->>'upcoming_kingdom_events', upcoming_kingdom_events),
        dietary_restrictions    = COALESCE(p_bio_data->>'dietary_restrictions',   dietary_restrictions),
        church                  = COALESCE(p_bio_data->>'church',  church),
        ministry                = COALESCE(p_bio_data->>'ministry', ministry),
        social_media            = COALESCE((p_bio_data->'social_media'), social_media),
        languages_spoken        = CASE WHEN p_bio_data->'languages_spoken' IS NOT NULL
                                  THEN ARRAY(SELECT jsonb_array_elements_text(p_bio_data->'languages_spoken'))
                                  ELSE languages_spoken END,
        email                   = COALESCE(p_bio_data->>'email', email),
        phone                   = COALESCE(p_bio_data->>'phone', phone),
        status                  = 'completed',
        profile_completed_at    = COALESCE(profile_completed_at, now()),
        updated_at              = now()
    WHERE id = v_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.submit_bio_by_token(TEXT, JSONB) TO anon;

-- 4. Recreate public_participants view to include state & city
DROP VIEW IF EXISTS public.public_participants;
CREATE OR REPLACE VIEW public.public_participants AS
SELECT
    p.id, p.status,
    p.name, p.country, p.state, p.city, p.nationality, p.short_bio,
    p.organization, p.role, p.role_tags, p.org_description,
    p.photo_url, p.promotional_picture_url,
    p.public_phone, p.public_email, p.public_website, p.public_other,
    p.areas_of_interest,
    p.created_at, p.updated_at
FROM public.participants p
WHERE p.status = 'completed';

ALTER VIEW public.public_participants OWNER TO postgres;
GRANT SELECT ON public.public_participants TO anon, authenticated;

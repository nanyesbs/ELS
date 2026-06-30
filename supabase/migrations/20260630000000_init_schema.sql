-- Enable pgcrypto for hashing functions (sha256)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_users table
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_tailor_order_id TEXT UNIQUE NOT NULL,
    ticket_tailor_buyer_email TEXT NOT NULL,
    ticket_tailor_buyer_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('registered', 'completed')) DEFAULT 'registered',
    token_hash TEXT UNIQUE NOT NULL,
    token_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    token_expires_at TIMESTAMPTZ,
    profile_completed_at TIMESTAMPTZ,
    reminder_sent_count INTEGER NOT NULL DEFAULT 0,
    last_reminder_sent_at TIMESTAMPTZ,
    
    -- Public Bio Fields (populated when status = 'completed')
    name TEXT,
    country TEXT,
    city TEXT,
    organization TEXT,
    church TEXT,
    ministry TEXT,
    role TEXT,
    photo_url TEXT,
    social_media JSONB DEFAULT '[]'::jsonb,
    areas_of_interest TEXT[] DEFAULT '{}',
    languages_spoken TEXT[] DEFAULT '{}',
    short_bio TEXT,
    
    -- Private Fields
    email TEXT, -- Participant contact email (can differ from buyer email)
    phone TEXT, -- Participant contact phone
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_participants_token_hash ON public.participants(token_hash);
CREATE INDEX idx_participants_status ON public.participants(status) WHERE status = 'completed';
CREATE INDEX idx_participants_name ON public.participants(name);

-- Create secure public view for completed profiles
CREATE OR REPLACE VIEW public.public_participants AS 
SELECT 
    id, 
    name, 
    country, 
    city, 
    organization, 
    church, 
    ministry, 
    role, 
    photo_url, 
    social_media, 
    areas_of_interest, 
    languages_spoken, 
    short_bio, 
    profile_completed_at
FROM public.participants
WHERE status = 'completed';

-- Set up view privileges
ALTER VIEW public.public_participants OWNER TO postgres;
GRANT SELECT ON public.public_participants TO anon, authenticated;

-- Enable Row Level Security (RLS) on base tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin Policy: Full Access to participants
CREATE POLICY admin_all_policy ON public.participants
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Admin Policy: Full Access to admin_users list
CREATE POLICY admin_profile_policy ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Secure RPC: Validate token and get participant record (returns details if token is valid and not expired)
CREATE OR REPLACE FUNCTION public.get_participant_by_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    status TEXT,
    ticket_tailor_buyer_name TEXT,
    name TEXT,
    country TEXT,
    city TEXT,
    organization TEXT,
    church TEXT,
    ministry TEXT,
    role TEXT,
    photo_url TEXT,
    social_media JSONB,
    areas_of_interest TEXT[],
    languages_spoken TEXT[],
    short_bio TEXT,
    email TEXT,
    phone TEXT
) SECURITY DEFINER AS $$
DECLARE
    v_hash TEXT;
BEGIN
    v_hash := encode(digest(p_token, 'sha256'), 'hex');
    RETURN QUERY
    SELECT 
        p.id,
        p.status,
        p.ticket_tailor_buyer_name,
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
        p.phone
    FROM public.participants p
    WHERE p.token_hash = v_hash 
      AND (p.token_expires_at IS NULL OR p.token_expires_at > now());
END;
$$ LANGUAGE plpgsql;

-- Secure RPC: Submit/Update profile via raw token validation
CREATE OR REPLACE FUNCTION public.submit_bio_by_token(
    p_token TEXT,
    p_bio_data JSONB
) RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    v_hash TEXT;
    v_id UUID;
BEGIN
    -- Hash the incoming raw token
    v_hash := encode(digest(p_token, 'sha256'), 'hex');
    
    -- Retrieve the matching active participant ID
    SELECT id INTO v_id 
    FROM public.participants 
    WHERE token_hash = v_hash 
      AND (token_expires_at IS NULL OR token_expires_at > now());
      
    IF v_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update participant details and mark as completed
    UPDATE public.participants
    SET 
        name = p_bio_data->>'name',
        country = p_bio_data->>'country',
        city = p_bio_data->>'city',
        organization = p_bio_data->>'organization',
        church = p_bio_data->>'church',
        ministry = p_bio_data->>'ministry',
        role = p_bio_data->>'role',
        photo_url = p_bio_data->>'photo_url',
        social_media = COALESCE((p_bio_data->'social_media'), '[]'::jsonb),
        areas_of_interest = ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_bio_data->'areas_of_interest', '[]'::jsonb))),
        languages_spoken = ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_bio_data->'languages_spoken', '[]'::jsonb))),
        short_bio = p_bio_data->>'short_bio',
        email = p_bio_data->>'email',
        phone = p_bio_data->>'phone',
        status = 'completed',
        profile_completed_at = now(),
        updated_at = now()
    WHERE id = v_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

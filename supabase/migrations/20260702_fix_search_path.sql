-- ============================================================
-- ELS App — Migration 3: Fix search_path on SECURITY DEFINER functions
--
-- SET search_path = public excluded the `extensions` schema where
-- Supabase installs pgcrypto's digest() function.
-- Corrected to: SET search_path = public, extensions
-- ============================================================

ALTER FUNCTION public.get_participant_by_token(TEXT)
  SET search_path = public, extensions;

ALTER FUNCTION public.submit_bio_by_token(TEXT, JSONB)
  SET search_path = public, extensions;

ALTER FUNCTION public.register_participant(TEXT, TEXT, TEXT)
  SET search_path = public, extensions;

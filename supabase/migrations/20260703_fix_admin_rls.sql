-- ============================================================
-- ELS App — Migration 4: Fix admin RLS recursion & promote admin user
--
-- 1. Fix admin_profile_policy RLS on admin_users table (recursion fix)
-- 2. Ensure admin_users table exists
-- 3. Enable RLS on admin_users
-- 4. Map esbsinterview@gmail.com into public.admin_users
-- ============================================================

-- Ensure the admin_users table exists
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop recursive policy and create clean one
DROP POLICY IF EXISTS admin_profile_policy ON public.admin_users;
CREATE POLICY admin_profile_policy ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Promote esbsinterview@gmail.com to Admin
INSERT INTO public.admin_users (id, email)
SELECT id, email FROM auth.users WHERE email = 'esbsinterview@gmail.com'
ON CONFLICT (id) DO NOTHING;

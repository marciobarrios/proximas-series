-- Review against the real schema before applying. Never run this automatically.
-- Usage: psql ... -v owner_user_id=<existing-owner-uuid> -f scripts/owner-only-rls.sql
-- Authentication user must already exist. psql safely quotes the variable below.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE owner_check (id uuid REFERENCES auth.users(id) NOT NULL) ON COMMIT DROP;
INSERT INTO owner_check VALUES (:'owner_user_id'::uuid);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- RESTRICTIVE policies AND with existing permissive owner-row policies.
-- Existing policies must grant the owner their own rows; these add no grants.
CREATE POLICY owner_only_access ON public.watchlist AS RESTRICTIVE FOR ALL TO public
  USING ((SELECT auth.uid()) = :'owner_user_id'::uuid)
  WITH CHECK ((SELECT auth.uid()) = :'owner_user_id'::uuid);
CREATE POLICY owner_only_access ON public.profiles AS RESTRICTIVE FOR ALL TO public
  USING ((SELECT auth.uid()) = :'owner_user_id'::uuid)
  WITH CHECK ((SELECT auth.uid()) = :'owner_user_id'::uuid);
COMMIT;

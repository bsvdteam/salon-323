-- ============================================================================
-- Grants for the server-side service_role.
-- ----------------------------------------------------------------------------
-- All app access goes through the service_role (server actions / route
-- handlers). In this project the default privileges did not grant new public
-- tables to service_role, so PostgREST returned 42501 ("permission denied").
-- We grant explicitly, and set default privileges so future migrations don't
-- hit the same wall.
--
-- anon / authenticated are intentionally NOT granted here: the frontend never
-- touches tables directly, and RLS is enabled with no policies. Grants for
-- `authenticated` come later, together with real member auth + RLS policies.
-- ============================================================================

grant usage on schema public to service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

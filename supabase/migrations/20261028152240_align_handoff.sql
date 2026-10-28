-- ============================================================================
-- Align with the design handoff (design_handoff_salon323/supabase/0001_init.sql).
-- The handoff tied member identity to auth.users (Supabase Auth); our current
-- model is username-only (no auth yet) and stays forward-compatible — real auth
-- later adds a nullable auth_user_id, no rewrite. These columns bring over the
-- fields the UI actually uses that the first cut missed.
-- ============================================================================

-- Barber's private note about a member + the member's default cut + optional
-- email (all from the handoff members table / the admin member records).
alter table members add column note          text;
alter table members add column contact_email text;
alter table members add column cut           text not null default 'Mid';

-- Make the fixed price and cancellation window configurable (handoff settings).
alter table barber_settings add column price_chf    integer not null default 20 check (price_chf >= 0);
alter table barber_settings add column cancel_hours integer not null default 24 check (cancel_hours >= 0);

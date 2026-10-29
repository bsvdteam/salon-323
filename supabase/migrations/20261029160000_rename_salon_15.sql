-- Rename: Salon 323 → Salon 15. The only place the name lives in the database
-- is the inviter fallback of validate_invite (shown as "Von Salon 15" when an
-- invite has no inviter). Body otherwise unchanged; create or replace keeps
-- the existing grants (service_role only).
create or replace function validate_invite(p_code text)
returns table (first_name text, inviter_name text)
language sql stable security definer set search_path = public as $$
  select
    i.first_name,
    coalesce(
      m.first_name ||
      case when coalesce(m.last_name, '') <> ''
           then ' ' || left(m.last_name, 1) || '.' else '' end,
      'Salon 15'
    ) as inviter_name
  from invites i
  left join members m on m.id = i.inviter_id
  where i.code = upper(p_code)
    and i.status = 'open'
    and i.expires_at > now();
$$;

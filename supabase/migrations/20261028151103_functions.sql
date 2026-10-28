-- ============================================================================
-- RPCs for the flows that must be atomic or need server-side logic.
-- All SECURITY DEFINER with a pinned search_path. Called only by the
-- service_role from server code.
-- ============================================================================

-- validate_invite — read-only check for the code-entry step. Returns the fixed
-- first name and a display name of the inviter ("Marco R."), or no row.
create or replace function validate_invite(p_code text)
returns table (first_name text, inviter_name text)
language sql stable security definer set search_path = public as $$
  select
    i.first_name,
    coalesce(
      m.first_name ||
      case when coalesce(m.last_name, '') <> ''
           then ' ' || left(m.last_name, 1) || '.' else '' end,
      'Salon 323'
    ) as inviter_name
  from invites i
  left join members m on m.id = i.inviter_id
  where i.code = upper(p_code)
    and i.status = 'open'
    and i.expires_at > now();
$$;

-- redeem_invite_create_member — atomic onboarding. Re-checks the invite, creates
-- the member (first name fixed by the invite), links invited_by, marks the
-- invite redeemed. Raises 'invite_invalid' or 'username_taken'.
create or replace function redeem_invite_create_member(
  p_code     text,
  p_last     text,
  p_username text,
  p_phone    text,
  p_card     int
) returns members
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites;
  v_member members;
begin
  select * into v_invite
    from invites
   where code = upper(p_code) and status = 'open' and expires_at > now()
   for update;
  if not found then
    raise exception 'invite_invalid' using errcode = 'P0001';
  end if;

  begin
    insert into members (username, first_name, last_name, phone, card_index, invited_by)
    values (lower(p_username), v_invite.first_name, p_last, p_phone, p_card, v_invite.inviter_id)
    returning * into v_member;
  exception
    when unique_violation then
      raise exception 'username_taken' using errcode = 'P0001';
  end;

  update invites
     set status = 'redeemed', redeemed_by = v_member.id, redeemed_at = now()
   where id = v_invite.id;

  return v_member;
end;
$$;

-- generate_invite — create a pending invite with a unique, unambiguous 6-char
-- code (no 0/O/1/I). The 3-active-invites limit is enforced by a trigger, which
-- raises if exceeded. Raises 'code_generation_failed' only if 10 random codes
-- all collide (practically never).
create or replace function generate_invite(p_inviter uuid, p_first_name text)
returns invites
language plpgsql security definer set search_path = public as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code     text;
  v_invite   invites;
  v_try      int := 0;
begin
  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into invites (code, inviter_id, first_name)
      values (v_code, p_inviter, p_first_name)
      returning * into v_invite;
      return v_invite;
    exception
      when unique_violation then
        if v_try > 10 then
          raise exception 'code_generation_failed';
        end if;
        -- loop and try another code
    end;
  end loop;
end;
$$;

grant execute on function validate_invite(text) to service_role;
grant execute on function redeem_invite_create_member(text, text, text, text, int) to service_role;
grant execute on function generate_invite(uuid, text) to service_role;

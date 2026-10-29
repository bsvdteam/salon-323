-- Referral codes: every member has ONE personal code that up to 5 people can
-- redeem (the barber: unlimited). Invitees enter their own first name. This
-- replaces the one-invite-per-person flow; the invites table stays so that
-- still-open codes from it keep working (they are checked as a fallback).

-- 6 chars from an unambiguous alphabet (no 0/O/1/I), unique across both the
-- members' codes and the legacy invite codes.
create or replace function new_ref_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code     text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from members where ref_code = v_code)
          and not exists (select 1 from invites where code = v_code);
  end loop;
  return v_code;
end;
$$;

alter table members
  add column if not exists ref_code text unique
  check (ref_code ~ '^[A-Z0-9]{6}$');
comment on column members.ref_code is
  'The member''s personal invite code — up to 5 people can join with it (barber: unlimited)';

update members set ref_code = new_ref_code() where ref_code is null;
alter table members alter column ref_code set not null;

-- every new member gets a code right away
create or replace function set_ref_code() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.ref_code is null then
    new.ref_code := new_ref_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ref_code on members;
create trigger trg_ref_code
  before insert on members
  for each row execute function set_ref_code();

-- validate_code — read-only check for the code-entry step. A member's personal
-- code (if it still has uses left) or a still-open legacy invite. Returns the
-- inviter's display name ("Pablo B.") and, for a legacy invite, the first name
-- it was made for (to prefill), or no row.
create or replace function validate_code(p_code text)
returns table (kind text, first_name text, inviter_name text)
language sql stable security definer set search_path = public as $$
  select * from (
    select 'ref'::text,
           null::text,
           m.first_name ||
             case when coalesce(m.last_name, '') <> ''
                  then ' ' || left(m.last_name, 1) || '.' else '' end
      from members m
     where m.ref_code = upper(p_code)
       and (m.is_barber
            or (select count(*) from members x where x.invited_by = m.id) < 5)
    union all
    select 'invite'::text,
           i.first_name,
           coalesce(
             m.first_name ||
               case when coalesce(m.last_name, '') <> ''
                    then ' ' || left(m.last_name, 1) || '.' else '' end,
             'Salon 15')
      from invites i
      left join members m on m.id = i.inviter_id
     where i.code = upper(p_code)
       and i.status = 'open'
       and i.expires_at > now()
  ) v
  limit 1;
$$;

-- redeem_code_create_member — atomic onboarding with either kind of code.
-- Locks the code owner (or the legacy invite) so two sign-ups can't both take
-- the 5th place. Raises 'invite_invalid', 'code_full' or 'username_taken'.
create or replace function redeem_code_create_member(
  p_code     text,
  p_first    text,
  p_last     text,
  p_username text,
  p_phone    text,
  p_card     int
) returns members
language plpgsql security definer set search_path = public as $$
declare
  v_owner  members;
  v_invite invites;
  v_member members;
  v_by     uuid;
begin
  select * into v_owner from members where ref_code = upper(p_code) for update;
  if found then
    if not v_owner.is_barber
       and (select count(*) from members where invited_by = v_owner.id) >= 5 then
      raise exception 'code_full' using errcode = 'P0001';
    end if;
    v_by := v_owner.id;
  else
    select * into v_invite
      from invites
     where code = upper(p_code) and status = 'open' and expires_at > now()
     for update;
    if not found then
      raise exception 'invite_invalid' using errcode = 'P0001';
    end if;
    v_by := v_invite.inviter_id;
  end if;

  begin
    insert into members (username, first_name, last_name, phone, card_index, invited_by)
    values (lower(p_username), p_first, p_last, p_phone, p_card, v_by)
    returning * into v_member;
  exception
    when unique_violation then
      raise exception 'username_taken' using errcode = 'P0001';
  end;

  if v_invite.id is not null then
    update invites
       set status = 'redeemed', redeemed_by = v_member.id, redeemed_at = now()
     where id = v_invite.id;
  end if;

  return v_member;
end;
$$;

revoke all on function new_ref_code() from public, anon, authenticated;
revoke all on function validate_code(text) from public, anon, authenticated;
revoke all on function redeem_code_create_member(text, text, text, text, text, int)
  from public, anon, authenticated;
grant execute on function new_ref_code() to service_role; -- via trg_ref_code
grant execute on function validate_code(text) to service_role;
grant execute on function redeem_code_create_member(text, text, text, text, text, int)
  to service_role;

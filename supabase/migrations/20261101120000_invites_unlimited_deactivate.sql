-- 1) A member's personal code has no cap any more (was 5): anyone with it can
--    join. Same functions as in 20261030090000_referral_codes.sql, minus the
--    count check; 'code_full' is never raised now.
-- 2) The barber can deactivate a member instead of deleting them: the account
--    stays (cuts, history, circle), but they can't book and their code no
--    longer lets anyone in. null = active.
alter table members add column deactivated_at timestamptz;

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
       and m.deactivated_at is null
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
  select * into v_owner from members
   where ref_code = upper(p_code) and deactivated_at is null;
  if found then
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

comment on column members.ref_code is
  'The member''s personal invite code — any number of people can join with it';

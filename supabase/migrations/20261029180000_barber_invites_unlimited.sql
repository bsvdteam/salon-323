-- The barber (owner) seeds the circle, so the "max 3 active invites" rule
-- applies to members only. Same rule as before otherwise: open + redeemed
-- invites count, revoked/expired free a slot.
create or replace function check_invite_limit() returns trigger
language plpgsql as $$
begin
  if new.inviter_id is not null
     and not exists (select 1 from members
                     where id = new.inviter_id and is_barber)
     and (select count(*) from invites
            where inviter_id = new.inviter_id
              and status in ('open','redeemed')) >= 3 then
    raise exception 'invite limit reached (max 3 per member)'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

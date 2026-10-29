-- Member numbers: next = highest number in use + 1 (instead of a sequence), so
-- a deleted newest account frees its number again and real members never see
-- gaps. A transaction-scoped advisory lock serialises concurrent sign-ups.
-- Barber accounts keep 0000 (set explicitly) and are not counted.
create or replace function set_member_no() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.member_no is null then
    perform pg_advisory_xact_lock(hashtext('members.member_no'));
    select lpad((coalesce(max(member_no::int), 0) + 1)::text, 4, '0')
      into new.member_no
      from members
     where not is_barber;
  end if;
  return new;
end $$;

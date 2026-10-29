-- Member login with username + 6-digit PIN (the barber keeps his password).
-- pin_hash: scrypt hash, never the PIN itself. login_failed/login_locked_until:
-- after 5 wrong tries the account is locked for 15 minutes (PIN and barber
-- password alike), so a 6-digit PIN can't be brute-forced online.
alter table members add column pin_hash           text;
alter table members add column login_failed       integer not null default 0;
alter table members add column login_locked_until timestamptz;

-- Count a failed login atomically; lock after the 5th miss. Returns true when
-- the account is now locked.
create or replace function register_login_failure(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_failed integer;
begin
  update members
     set login_failed = login_failed + 1
   where id = p_id
  returning login_failed into v_failed;
  if v_failed >= 5 then
    update members
       set login_failed = 0,
           login_locked_until = now() + interval '15 minutes'
     where id = p_id;
    return true;
  end if;
  return false;
end;
$$;

revoke all on function register_login_failure(uuid) from public, anon, authenticated;
grant execute on function register_login_failure(uuid) to service_role;

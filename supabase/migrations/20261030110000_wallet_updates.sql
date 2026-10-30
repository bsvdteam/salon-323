-- Apple Wallet pass updates (PassKit web service). Wallet registers each
-- device that holds a member's pass; when the pass content changes the server
-- pushes an empty APNs notification and Wallet fetches the new pass.

-- One row per device × pass. serial_number = the member id (pass serialNumber).
create table wallet_registrations (
  device_library_id text        not null,
  serial_number     uuid        not null references members(id) on delete cascade,
  push_token        text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (device_library_id, serial_number)
);
create index wallet_registrations_serial_idx on wallet_registrations(serial_number);
alter table wallet_registrations enable row level security; -- service_role only

-- When the member's pass content last changed (drives Last-Modified and the
-- "passes updated since" list) and which layout they installed (poster on
-- iOS 27+, else storeCard) — Wallet's update requests carry no iOS version.
alter table members
  add column if not exists pass_updated_at timestamptz not null default now(),
  add column if not exists pass_poster     boolean     not null default false;

-- Anything shown on the pass changes → bump pass_updated_at.
create or replace function touch_pass_from_appointment() returns trigger
language plpgsql set search_path = public as $$
begin
  update members set pass_updated_at = now()
   where id = coalesce(new.member_id, old.member_id);
  return null;
end $$;

create trigger trg_appointment_pass
  after insert or update or delete on appointments
  for each row execute function touch_pass_from_appointment();

create or replace function touch_pass_from_member() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.cuts       is distinct from old.cuts
  or new.first_name is distinct from old.first_name
  or new.last_name  is distinct from old.last_name
  or new.card_index is distinct from old.card_index
  or new.member_no  is distinct from old.member_no then
    new.pass_updated_at := now();
  end if;
  return new;
end $$;

create trigger trg_member_pass
  before update on members
  for each row execute function touch_pass_from_member();

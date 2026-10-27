-- Salon 323 – initial schema
create type member_role as enum ('member', 'barber');
create type invite_status as enum ('open', 'pending', 'accepted');
create type appt_status as enum ('confirmed', 'canceled', 'done', 'no_show');
create type appt_source as enum ('portal', 'calendly');

create table members (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null unique,
  role member_role not null default 'member',
  invited_by uuid references members(id),
  template text[] not null default '{haare,bart}',
  cut text default 'Mid',
  note text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table invites (
  code char(6) primary key,
  inviter_id uuid not null references members(id) on delete cascade,
  invitee_id uuid references members(id),
  status invite_status not null default 'open',
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz generated always as (starts_at + interval '30 minutes') stored,
  services text[] not null,
  cut text,
  is_first_visit boolean not null default false,
  price_chf int not null default 20,
  credit_chf int not null default 0 check (credit_chf between 0 and 20),
  status appt_status not null default 'confirmed',
  source appt_source not null default 'portal',
  calendly_event_uri text unique,
  calendly_invitee_uri text,
  created_at timestamptz not null default now()
);
create index on appointments (starts_at);
create index on appointments (member_id, starts_at desc);

create table absences (
  id uuid primary key default gen_random_uuid(),
  from_date date not null,
  to_date date not null check (to_date >= from_date),
  reason text not null default 'Ferien',
  source text not null default 'HIER' check (source in ('HIER', 'CALENDLY'))
);

create table credits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  amount_chf int not null,
  reason text not null,
  appointment_id uuid references appointments(id),
  created_at timestamptz not null default now()
);

create table settings (
  id boolean primary key default true check (id),
  price_chf int not null default 20,
  cancel_hours int not null default 24,
  address_1 text not null default 'Steineggasse 4',
  address_2 text not null default '9113 Degersheim',
  phone text
);
insert into settings default values;

create view member_stats as
select m.id,
  count(a.*) filter (where a.status = 'done') as visits,
  case
    when count(a.*) filter (where a.status = 'done') >= 50 then 'IV'
    when count(a.*) filter (where a.status = 'done') >= 25 then 'III'
    when count(a.*) filter (where a.status = 'done') >= 10 then 'II'
    else 'I' end as tier,
  coalesce((select sum(c.amount_chf) from credits c where c.member_id = m.id), 0) as credit_chf
from members m left join appointments a on a.member_id = m.id
group by m.id;

create or replace function is_barber() returns boolean language sql stable security definer as $$
  select exists (select 1 from members where id = auth.uid() and role = 'barber');
$$;

create or replace function enforce_invite_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from invites where inviter_id = new.inviter_id) >= 3 then
    raise exception 'invite_limit';
  end if;
  return new;
end $$;
create trigger invites_limit before insert on invites for each row execute function enforce_invite_limit();

alter table members enable row level security;
alter table invites enable row level security;
alter table appointments enable row level security;
alter table absences enable row level security;
alter table credits enable row level security;
alter table settings enable row level security;

create policy own_member on members for select using (id = auth.uid() or is_barber());
create policy upd_member on members for update using (id = auth.uid() or is_barber());
create policy own_invites on invites for select using (inviter_id = auth.uid() or is_barber());
create policy ins_invites on invites for insert with check (inviter_id = auth.uid());
create policy own_appts on appointments for select using (member_id = auth.uid() or is_barber());
create policy barber_appts on appointments for all using (is_barber());
create policy read_abs on absences for select using (auth.uid() is not null);
create policy barber_abs on absences for all using (is_barber());
create policy own_credits on credits for select using (member_id = auth.uid() or is_barber());
create policy read_settings on settings for select using (true);
create policy barber_settings on settings for update using (is_barber());
-- Buchen/Absagen laufen über Server Actions (Calendly zuerst, dann Insert mit Service-Role).

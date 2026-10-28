-- ============================================================================
-- Salon 323 — initial schema
-- ----------------------------------------------------------------------------
-- System of record for the members platform: members, invites, appointments,
-- and the barber's availability config. The barber's LIVE agenda (free/busy +
-- booked slots) stays in Google Calendar (see src/lib/google/calendar.ts);
-- an appointment row links to its calendar event via google_event_id.
--
-- Auth model (for now): members log in with a username and no password. All DB
-- access goes through server-side code using the service_role key (server
-- actions / route handlers). RLS is enabled with NO anon/authenticated
-- policies, so a leaked anon key reads nothing. When we add real member auth
-- (OTP / passkey) later, we add auth.uid()-based policies — the schema does
-- not change.
-- ============================================================================

create extension if not exists citext;

-- ── members ────────────────────────────────────────────────────────────────
-- Human-friendly, zero-padded member number ("0047"), assigned by a sequence.
create sequence if not exists member_no_seq start 1;

create table members (
  id           uuid primary key default gen_random_uuid(),
  member_no    text        unique not null,
  username     citext      unique not null,
  first_name   text        not null,
  last_name    text        not null default '',
  phone        text        not null default '',
  card_index   smallint    not null default 0 check (card_index between 0 and 2),
  cuts         integer     not null default 0 check (cuts >= 0),
  -- The member's saved default services for the next booking ("Vorlage").
  template     text[]      not null default array['haare','bart'],
  member_since date        not null default current_date,
  -- Self-referential: who invited this member (null for founders / the barber).
  invited_by   uuid        references members(id) on delete set null,
  is_barber    boolean     not null default false,
  -- Password login. Set ONLY for accounts that need a password (the barber);
  -- null = username-only member. Format: scrypt$<saltHex>$<hashHex>. Verified
  -- server-side; never leaves the server. Regular members get this when we add
  -- real auth for everyone later.
  password_hash text,
  created_at   timestamptz not null default now(),
  constraint username_format check (username ~* '^[a-z0-9_]{2,20}$'),
  -- A barber MUST have a password. (Members may get one later without
  -- breaking this, so it only requires — not forbids — a password.)
  constraint barber_needs_password check (not is_barber or password_hash is not null)
);

-- Tier (Guest/Member/Patron/Inner Circle) is derived from `cuts` in the app;
-- it is intentionally NOT stored.

comment on column members.template is 'Default service keys for the next booking, e.g. {haare,bart}';
comment on column members.invited_by is 'FK to the member who invited this one; null for the barber/founders';

create index members_invited_by_idx on members(invited_by);

-- Auto-assign member_no on insert (zero-padded to 4 digits) unless provided.
create or replace function set_member_no() returns trigger
language plpgsql as $$
begin
  if new.member_no is null then
    new.member_no := lpad(nextval('member_no_seq')::text, 4, '0');
  end if;
  return new;
end $$;

create trigger trg_member_no
  before insert on members
  for each row execute function set_member_no();

-- ── invites ────────────────────────────────────────────────────────────────
-- One table for BOTH sides: a member generates an invite (status 'open' with a
-- fixed first name for the invitee); the invitee redeems it (status
-- 'redeemed', redeemed_by set). Replaces the static src/config/access.ts list.
create table invites (
  id          uuid primary key default gen_random_uuid(),
  code        text        unique not null check (code ~ '^[A-Z0-9]{6}$'),
  inviter_id  uuid        references members(id) on delete cascade,
  first_name  text        not null,
  status      text        not null default 'open'
                check (status in ('open','redeemed','revoked','expired')),
  redeemed_by uuid        references members(id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  redeemed_at timestamptz,
  created_at  timestamptz not null default now()
);

comment on column invites.inviter_id is 'Who created the invite; null allowed for bootstrap/system invites';
comment on column invites.first_name is 'First name the inviter fixes for the invitee (not editable during onboarding)';

create index invites_inviter_idx on invites(inviter_id);
create index invites_status_idx  on invites(status);

-- Enforce the "max 3 active invites per member" rule at the DB level, counting
-- invites that are still open or already redeemed (revoked/expired free a slot).
create or replace function check_invite_limit() returns trigger
language plpgsql as $$
begin
  if new.inviter_id is not null
     and (select count(*) from invites
            where inviter_id = new.inviter_id
              and status in ('open','redeemed')) >= 3 then
    raise exception 'invite limit reached (max 3 per member)'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger trg_invite_limit
  before insert on invites
  for each row execute function check_invite_limit();

-- ── appointments ───────────────────────────────────────────────────────────
-- Supabase is the system of record; google_event_id links to the mirrored
-- Google Calendar event. "Next appointment" = soonest booked row in the
-- future; "history" = past / done rows.
create table appointments (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid        not null references members(id) on delete cascade,
  starts_at          timestamptz not null,
  duration_min       integer     not null default 30 check (duration_min > 0),
  services           text[]      not null check (cardinality(services) >= 1),
  cut                text,
  status             text        not null default 'booked'
                       check (status in ('booked','done','cancelled','no_show')),
  price_chf          integer     not null default 20 check (price_chf >= 0),
  credit_applied_chf integer     not null default 0 check (credit_applied_chf >= 0),
  pay_method         text        not null default 'ort'
                       check (pay_method in ('ort','twint','apple')),
  google_event_id    text,
  note               text,
  created_at         timestamptz not null default now()
);

create index appts_member_idx on appointments(member_id);
create index appts_starts_idx on appointments(starts_at);

-- ── barber availability ─────────────────────────────────────────────────────
-- Weekly opening-hours template (0 = Sunday … 6 = Saturday). Minutes from
-- midnight. Combined with Google Calendar busy ranges and absences to compute
-- the member-facing free slots.
create table barber_hours (
  weekday   smallint primary key check (weekday between 0 and 6),
  is_open   boolean  not null default false,
  open_min  integer  not null default 540,
  close_min integer  not null default 1080,
  check (close_min > open_min)
);

-- Per-date exceptions to the weekly template (e.g. "Fri open later this week").
create table barber_date_overrides (
  override_date date primary key,
  is_open       boolean not null default true,
  open_min      integer not null default 540,
  close_min     integer not null default 1080,
  check (close_min > open_min)
);

-- Multi-day absences (holiday, sick, …). source marks where it came from.
create table barber_absences (
  id         uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date   date not null,
  reason     text not null default 'Ferien',
  source     text not null default 'HIER' check (source in ('HIER','CALENDLY','GOOGLE')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- Singleton settings row (lunch pause, integration status).
create table barber_settings (
  id                 boolean primary key default true check (id),
  pause_start_min    integer not null default 720,
  pause_end_min      integer not null default 780,
  calendly_connected boolean not null default false,
  check (pause_end_min > pause_start_min)
);

-- Seed the barber config with the prototype defaults (Tue–Sat open).
insert into barber_hours (weekday, is_open, open_min, close_min) values
  (0, false, 540, 1080),  -- So
  (1, false, 540, 1080),  -- Mo
  (2, true,  540, 1080),  -- Di
  (3, true,  540, 1080),  -- Mi
  (4, true,  540, 1170),  -- Do (länger)
  (5, true,  540, 1080),  -- Fr
  (6, true,  540, 960);   -- Sa (kürzer)

insert into barber_settings (id) values (true);

-- ── row level security ──────────────────────────────────────────────────────
-- Enable RLS everywhere; grant NO policies. anon/authenticated roles therefore
-- have no access — every read/write goes through the service_role on the
-- server. Real member-facing policies arrive with real auth.
alter table members              enable row level security;
alter table invites              enable row level security;
alter table appointments         enable row level security;
alter table barber_hours         enable row level security;
alter table barber_date_overrides enable row level security;
alter table barber_absences      enable row level security;
alter table barber_settings      enable row level security;

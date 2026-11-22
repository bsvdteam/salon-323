-- Web-Push für Laurin: neue Buchungen, Absagen und Verschiebungen kommen als
-- Mitteilung aufs iPhone (Home-Bildschirm-App). Nur der Server liest/schreibt
-- (service_role) — RLS an, keine Policies.

-- Ein Gerät = ein Abo (endpoint ist pro Browser/Gerät eindeutig).
create table push_subscriptions (
  endpoint   text primary key,
  member_id  uuid not null references members(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_member_idx on push_subscriptions(member_id);
alter table push_subscriptions enable row level security;

-- VAPID-Schlüsselpaar des Servers, einmalig selbst erzeugt (wie der
-- Google-Token: liegt in der DB, keine Env-Variable nötig).
create table push_keys (
  id          smallint primary key default 1 check (id = 1),
  public_key  text not null,
  private_key text not null,
  created_at  timestamptz not null default now()
);
alter table push_keys enable row level security;

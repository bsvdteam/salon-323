-- Feedback der Mitglieder zur App: eine Note 1–10, dazu (optional) was ihr
-- fehlt / sie 10× wertvoller machen würde und was stört. Nur der Barber sieht
-- es (Admin → Feedback). Wird ein Mitglied gelöscht, bleibt sein Feedback
-- anonym stehen.
create table feedback (
  id          uuid        primary key default gen_random_uuid(),
  member_id   uuid        references members(id) on delete set null,
  score       smallint    not null check (score between 1 and 10),
  wish        text        check (char_length(wish) <= 1000),
  annoy       text        check (char_length(annoy) <= 1000),
  source      text        not null default 'prompt'
                          check (source in ('prompt', 'profile')),
  created_at  timestamptz not null default now()
);
create index feedback_created_idx on feedback (created_at desc);
alter table feedback enable row level security; -- service_role only

-- Die Frage kommt ab und zu von selbst, nie gleich am Anfang und nie kurz
-- hintereinander: gezählt werden App-Öffnungen, gefragt wird erst wieder
-- nach feedback_snooze_until.
alter table members
  add column app_opens integer not null default 0,
  add column feedback_snooze_until timestamptz;

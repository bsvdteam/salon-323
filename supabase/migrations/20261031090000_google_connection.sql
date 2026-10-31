-- The salon's Google Calendar connection. One row: the refresh token from the
-- barber's one-click "Mit Google verbinden" in /admin, so reconnecting to a
-- different Google account needs no env change or redeploy. GOOGLE_REFRESH_TOKEN
-- in the env stays as a fallback until the first connect.
create table google_connection (
  id            smallint    primary key default 1 check (id = 1),
  refresh_token text        not null,
  account_email text,
  connected_at  timestamptz not null default now()
);
alter table google_connection enable row level security; -- service_role only

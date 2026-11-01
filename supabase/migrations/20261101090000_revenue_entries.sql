-- Umsatz, den der Barber von Hand einträgt: nachgetragene Monate von vor dem
-- Tool, oder Termine, die nicht über die App gebucht wurden. Zählt im
-- Umsatz-Tab zusammen mit den erledigten Terminen. Datum = Salon-Kalendertag.
create table revenue_entries (
  id          uuid          primary key default gen_random_uuid(),
  day         date          not null,
  amount_chf  numeric(10,2) not null check (amount_chf > 0),
  note        text,
  created_at  timestamptz   not null default now()
);
create index revenue_entries_day_idx on revenue_entries (day);
alter table revenue_entries enable row level security; -- service_role only

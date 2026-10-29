-- ============================================================================
-- 1) A cut counts once its appointment time has passed — not only when the barber
--    remembers to tick it off. settle_past_appointments() flips every past
--    'booked' appointment to 'done' and bumps the member's cuts in one atomic
--    statement; the server calls it lazily before reading cuts / revenue.
-- 2) mark_appointment_done() — the barber's manual "erledigt" (also before the
--    time), atomic so a cut is never counted twice.
-- 3) Availability settings the barber portal edits (buffer, lead time) and the
--    barber's real hours: every day 19:00–22:00 (last slot 21:30).
-- ============================================================================

create or replace function settle_past_appointments()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  with settled as (
    update appointments
       set status = 'done'
     where status = 'booked' and starts_at <= now()
    returning member_id
  ), per_member as (
    select member_id, count(*)::int as n from settled group by member_id
  )
  update members m
     set cuts = m.cuts + p.n
    from per_member p
   where m.id = p.member_id;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function mark_appointment_done(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_member uuid;
begin
  update appointments
     set status = 'done'
   where id = p_id and status = 'booked'
  returning member_id into v_member;
  if v_member is null then
    return false;
  end if;
  update members set cuts = cuts + 1 where id = v_member;
  return true;
end;
$$;

revoke all on function settle_past_appointments() from public, anon, authenticated;
revoke all on function mark_appointment_done(uuid) from public, anon, authenticated;
grant execute on function settle_past_appointments() to service_role;
grant execute on function mark_appointment_done(uuid) to service_role;

alter table barber_settings add column buffer_min integer not null default 0 check (buffer_min >= 0);
alter table barber_settings add column lead_hours integer not null default 2 check (lead_hours >= 0);

update barber_hours set is_open = true, open_min = 1140, close_min = 1320;

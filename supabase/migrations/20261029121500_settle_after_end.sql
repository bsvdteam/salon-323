-- A cut counts once the appointment is over (start + duration), not at its
-- start — so the barber's "Im Stuhl" view still shows a running appointment.
create or replace function settle_past_appointments()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  with settled as (
    update appointments
       set status = 'done'
     where status = 'booked'
       and starts_at + make_interval(mins => duration_min) <= now()
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

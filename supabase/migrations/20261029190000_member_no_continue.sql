-- Member numbers continue from the highest one in use, so deleted test
-- accounts leave no gaps for real members (Pablo is N° 0001, next is 0002).
-- Barber accounts keep 0000 and never draw from the sequence.
select setval(
  'member_no_seq',
  greatest(1, (select coalesce(max(member_no::int), 0) from members where not is_barber)),
  (select count(*) > 0 from members where not is_barber)
);

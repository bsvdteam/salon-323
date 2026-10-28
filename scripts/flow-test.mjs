// End-to-end backend flow test against the live DB. Creates temp rows and
// deletes them again. Run: node --env-file=.env.local scripts/flow-test.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const log = (...a) => console.log(...a);
const sfx = Math.random().toString(36).slice(2, 7);
const first = (d) => (Array.isArray(d) ? d[0] : d);

let founderId, noahId, apptId;
let fail = false;
try {
  // founder (no invite needed)
  const { data: f, error: fe } = await sb
    .from("members")
    .insert({ username: `founder_${sfx}`, first_name: "Founder", last_name: "Test" })
    .select()
    .single();
  if (fe) throw fe;
  founderId = f.id;
  log(`✓ founder created  no=${f.member_no} id=${f.id.slice(0, 8)}`);

  // generate invite
  const { data: inv, error: ge } = await sb.rpc("generate_invite", {
    p_inviter: founderId,
    p_first_name: "TestNoah",
  });
  if (ge) throw ge;
  const invite = first(inv);
  log(`✓ invite generated  code=${invite.code}`);

  // validate (lowercase input, should still match)
  const { data: val } = await sb.rpc("validate_invite", {
    p_code: invite.code.toLowerCase(),
  });
  const v = first(val);
  log(`✓ validate_invite   first=${v?.first_name} from=${v?.inviter_name}`);

  // redeem + create member (atomic)
  const { data: mem, error: re } = await sb.rpc("redeem_invite_create_member", {
    p_code: invite.code,
    p_last: "Neu",
    p_username: `noah_${sfx}`,
    p_phone: "+41790000000",
    p_card: 1,
  });
  if (re) throw re;
  const noah = first(mem);
  noahId = noah.id;
  log(
    `✓ member created    no=${noah.member_no} user=${noah.username} invited_by_founder=${noah.invited_by === founderId}`,
  );

  // redeem again → invite already consumed
  const { error: dup } = await sb.rpc("redeem_invite_create_member", {
    p_code: invite.code,
    p_last: "X",
    p_username: `other_${sfx}`,
    p_phone: "+41",
    p_card: 0,
  });
  log(`✓ re-redeem blocked ${dup ? "(" + dup.message + ")" : "NO — BUG"}`);
  if (!dup) fail = true;

  // circle (via the same query shape as getCircle)
  const { data: circ } = await sb
    .from("invites")
    .select("status, first_name, redeemed_by")
    .eq("inviter_id", founderId);
  log(`✓ circle rows       ${JSON.stringify(circ)}`);

  // member count (non-barber)
  const { count } = await sb
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("is_barber", false);
  log(`✓ member count      ${count}`);

  // appointment
  const { data: ap, error: ae } = await sb
    .from("appointments")
    .insert({
      member_id: noahId,
      starts_at: new Date(Date.now() + 2 * 864e5).toISOString(),
      services: ["haare", "bart"],
      cut: "Mid",
    })
    .select()
    .single();
  if (ae) throw ae;
  apptId = ap.id;
  log(`✓ appointment       status=${ap.status} price=${ap.price_chf}`);

  // 3-invite limit: founder has 1 redeemed; add 2 → 3 active; 4th must fail
  for (let i = 0; i < 2; i++) {
    const { error } = await sb.rpc("generate_invite", {
      p_inviter: founderId,
      p_first_name: `Extra${i}`,
    });
    if (error) throw error;
  }
  const { error: limitErr } = await sb.rpc("generate_invite", {
    p_inviter: founderId,
    p_first_name: "Over",
  });
  log(`✓ 4th invite blocked ${limitErr ? "(" + limitErr.message + ")" : "NO — BUG"}`);
  if (!limitErr) fail = true;

  // empty services rejected
  const { error: emptyErr } = await sb
    .from("appointments")
    .insert({ member_id: noahId, starts_at: new Date().toISOString(), services: [] });
  log(`✓ empty services rejected ${emptyErr ? "yes" : "NO — BUG"}`);
  if (!emptyErr) fail = true;
} catch (e) {
  fail = true;
  log("✗ ERROR:", e.message || e);
} finally {
  if (apptId) await sb.from("appointments").delete().eq("id", apptId);
  if (founderId) await sb.from("invites").delete().eq("inviter_id", founderId);
  if (noahId) await sb.from("members").delete().eq("id", noahId);
  if (founderId) await sb.from("members").delete().eq("id", founderId);
  log(`\n${fail ? "✗ SOME CHECKS FAILED" : "✓ ALL FLOW CHECKS PASSED"} · cleanup done`);
  process.exit(fail ? 1 : 0);
}

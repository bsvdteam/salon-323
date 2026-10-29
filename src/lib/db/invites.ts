// SERVER-ONLY invite data access (service_role). Every member has one personal
// code (members.ref_code) that up to INVITE_LIMIT people can join with — the
// barber's has no limit. Still-open codes from the old per-person invites
// table keep working through the same RPCs. Also assembles the "circle" view
// (who joined with a member's code + who they brought in).
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MemberRow } from "@/lib/supabase/types";

/** How many people can join with one member's code (DB: redeem_code_…). */
export const INVITE_LIMIT = 5;

export type InviteValidation = {
  /** Prefill for a legacy per-person invite; "" for a personal code. */
  firstName: string;
  inviterName: string;
};

/** Read-only check used by the code-entry step. Null = no usable code. */
export async function validateInvite(
  code: string,
): Promise<InviteValidation | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("validate_code", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { firstName: row.first_name ?? "", inviterName: row.inviter_name };
}

export type RedeemArgs = {
  code: string;
  first: string;
  last: string;
  username: string;
  phone: string;
  card: number;
};
export type RedeemResult =
  | { ok: true; member: MemberRow }
  | {
      ok: false;
      error: "invite_invalid" | "code_full" | "username_taken" | "unknown";
    };

/** Atomic onboarding: check the code (and its uses) and create the member. */
export async function redeemInviteCreateMember(
  args: RedeemArgs,
): Promise<RedeemResult> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("redeem_code_create_member", {
    p_code: args.code,
    p_first: args.first.trim(),
    p_last: args.last.trim(),
    p_username: args.username.trim().toLowerCase(),
    p_phone: args.phone.trim(),
    p_card: args.card,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("username_taken"))
      return { ok: false, error: "username_taken" };
    if (m.includes("code_full")) return { ok: false, error: "code_full" };
    if (m.includes("invite_invalid"))
      return { ok: false, error: "invite_invalid" };
    return { ok: false, error: "unknown" };
  }
  const member = (Array.isArray(data) ? data[0] : data) as MemberRow;
  return { ok: true, member };
}

export type CircleNode = {
  id: string;
  first: string;
  last: string;
  cuts: number;
  since: string; // date
  kids: { first: string; last: string; cuts: number; since: string }[];
};

/** The member's circle: everyone who joined with their code (oldest first),
 *  each with the people they brought in. */
export async function getCircle(memberId: string): Promise<CircleNode[]> {
  const sb = supabaseAdmin();
  const { data: direct, error } = await sb
    .from("members")
    .select("*")
    .eq("invited_by", memberId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const ids = (direct ?? []).map((m) => m.id);

  const kidsByParent = new Map<string, MemberRow[]>();
  if (ids.length) {
    const { data: kids, error: e2 } = await sb
      .from("members")
      .select("*")
      .in("invited_by", ids)
      .order("created_at", { ascending: true });
    if (e2) throw e2;
    for (const k of kids ?? []) {
      const p = k.invited_by!;
      (kidsByParent.get(p) ?? kidsByParent.set(p, []).get(p)!).push(k);
    }
  }

  return (direct ?? []).map((m) => ({
    id: m.id,
    first: m.first_name,
    last: m.last_name,
    cuts: m.cuts,
    since: m.member_since,
    kids: (kidsByParent.get(m.id) ?? []).map((k) => ({
      first: k.first_name,
      last: k.last_name,
      cuts: k.cuts,
      since: k.member_since,
    })),
  }));
}

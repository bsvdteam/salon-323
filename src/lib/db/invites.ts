// SERVER-ONLY invite data access (service_role). Every member has one personal
// code (members.ref_code) that any number of people can join with. Still-open
// codes from the old per-person invites table keep working through the same
// RPCs. Also assembles the "circle" view (the tree of who brought in whom).
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MemberRow } from "@/lib/supabase/types";

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
  points?: number; // filled in by the bundle (loadStandings)
  kids: CircleNode[]; // the people this one brought in, and so on
};

/** How many generations below the member the circle reaches. */
const CIRCLE_DEPTH = 5;

/** The member's circle as a tree: everyone who joined with their code (oldest
 *  first), the people those brought in, and so on — CIRCLE_DEPTH levels deep.
 *  One query per level. */
export async function getCircle(memberId: string): Promise<CircleNode[]> {
  const sb = supabaseAdmin();
  const byParent = new Map<string, CircleNode[]>();
  let parents = [memberId];
  for (let level = 0; level < CIRCLE_DEPTH && parents.length; level++) {
    const { data, error } = await sb
      .from("members")
      .select("id, first_name, last_name, cuts, member_since, invited_by")
      .in("invited_by", parents)
      .order("created_at", { ascending: true });
    if (error) throw error;
    for (const m of data ?? []) {
      const node: CircleNode = {
        id: m.id,
        first: m.first_name,
        last: m.last_name,
        cuts: m.cuts,
        since: m.member_since,
        kids: [],
      };
      const p = m.invited_by!;
      (byParent.get(p) ?? byParent.set(p, []).get(p)!).push(node);
    }
    parents = (data ?? []).map((m) => m.id);
  }
  const attach = (nodes: CircleNode[]): CircleNode[] =>
    nodes.map((n) => ({ ...n, kids: attach(byParent.get(n.id) ?? []) }));
  return attach(byParent.get(memberId) ?? []);
}

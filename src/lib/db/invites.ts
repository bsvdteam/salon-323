// SERVER-ONLY invite data access (service_role). Wraps the atomic RPCs and
// assembles the "circle" view (a member's invitees + second-degree invitees).
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MemberRow } from "@/lib/supabase/types";

export type InviteValidation = { firstName: string; inviterName: string };

/** Read-only check used by the code-entry step. Null = no valid open invite. */
export async function validateInvite(
  code: string,
): Promise<InviteValidation | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("validate_invite", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { firstName: row.first_name, inviterName: row.inviter_name };
}

export type RedeemArgs = {
  code: string;
  last: string;
  username: string;
  phone: string;
  card: number;
};
export type RedeemResult =
  | { ok: true; member: MemberRow }
  | { ok: false; error: "invite_invalid" | "username_taken" | "unknown" };

/** Atomic onboarding: redeem the invite and create the member. */
export async function redeemInviteCreateMember(
  args: RedeemArgs,
): Promise<RedeemResult> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("redeem_invite_create_member", {
    p_code: args.code,
    p_last: args.last.trim(),
    p_username: args.username.trim().toLowerCase(),
    p_phone: args.phone.trim(),
    p_card: args.card,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("username_taken")) return { ok: false, error: "username_taken" };
    if (m.includes("invite_invalid")) return { ok: false, error: "invite_invalid" };
    return { ok: false, error: "unknown" };
  }
  const member = (Array.isArray(data) ? data[0] : data) as MemberRow;
  return { ok: true, member };
}

export type GenerateResult =
  | { ok: true; code: string; firstName: string }
  | { ok: false; error: "limit" | "unknown" };

/** Create a pending invite for `firstName`, owned by `inviterId`. */
export async function generateInvite(
  inviterId: string,
  firstName: string,
): Promise<GenerateResult> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("generate_invite", {
    p_inviter: inviterId,
    p_first_name: firstName.trim(),
  });
  if (error) {
    if ((error.message || "").includes("invite limit"))
      return { ok: false, error: "limit" };
    return { ok: false, error: "unknown" };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { code: string };
  return { ok: true, code: row.code, firstName: firstName.trim() };
}

export type CircleNode =
  | {
      kind: "member";
      id: string;
      first: string;
      last: string;
      cuts: number;
      since: string; // date
      kids: { first: string; last: string; cuts: number; since: string }[];
    }
  | { kind: "pending"; first: string; code: string; expiresAt: string };

/** The member's circle: redeemed invitees (with their own invitees) + pendings. */
export async function getCircle(memberId: string): Promise<CircleNode[]> {
  const sb = supabaseAdmin();
  const { data: invites, error } = await sb
    .from("invites")
    .select("status, first_name, code, expires_at, redeemed_by")
    .eq("inviter_id", memberId)
    .in("status", ["open", "redeemed"])
    .order("created_at", { ascending: true });
  if (error) throw error;

  const redeemedIds = (invites ?? [])
    .map((i) => i.redeemed_by)
    .filter((x): x is string => !!x);

  // Redeemed invitees …
  const membersById = new Map<string, MemberRow>();
  if (redeemedIds.length) {
    const { data: mem, error: e2 } = await sb
      .from("members")
      .select("*")
      .in("id", redeemedIds);
    if (e2) throw e2;
    for (const m of mem ?? []) membersById.set(m.id, m);
  }

  // … and their invitees (second degree).
  const kidsByParent = new Map<string, MemberRow[]>();
  if (redeemedIds.length) {
    const { data: kids, error: e3 } = await sb
      .from("members")
      .select("*")
      .in("invited_by", redeemedIds);
    if (e3) throw e3;
    for (const k of kids ?? []) {
      const p = k.invited_by!;
      (kidsByParent.get(p) ?? kidsByParent.set(p, []).get(p)!).push(k);
    }
  }

  const nodes: CircleNode[] = [];
  for (const inv of invites ?? []) {
    if (inv.status === "redeemed" && inv.redeemed_by) {
      const m = membersById.get(inv.redeemed_by);
      if (!m) continue;
      nodes.push({
        kind: "member",
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
      });
    } else if (inv.status === "open") {
      nodes.push({
        kind: "pending",
        first: inv.first_name,
        code: inv.code,
        expiresAt: inv.expires_at,
      });
    }
  }
  return nodes;
}

// SERVER-ONLY: members' feedback on the app, and when to ask for it.
import { supabaseAdmin } from "@/lib/supabase/server";

const DAY = 86_400_000;
const later = (days: number) => new Date(Date.now() + days * DAY).toISOString();

// When the question comes by itself: never in the first few app opens, then
// at random on roughly every fourth open — and after that not again for a
// while (asked → 14 days, "Später" → 45, answered → 90).
const FIRST_OPEN = 4;
const CHANCE = 0.25;
export const SNOOZE = { asked: 14, later: 45, answered: 90 } as const;

/** Count one app open; true if the feedback question should come up now. */
export async function countOpenAskFeedback(memberId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data: m } = await sb
    .from("members")
    .select("app_opens, feedback_snooze_until, feedback_always, is_barber")
    .eq("id", memberId)
    .maybeSingle();
  if (!m || m.is_barber) return false;
  const opens = m.app_opens + 1;
  const free =
    !m.feedback_snooze_until ||
    new Date(m.feedback_snooze_until).getTime() < Date.now();
  // test accounts (feedback_always) get it on every open
  const ask =
    m.feedback_always ||
    (opens >= FIRST_OPEN && free && Math.random() < CHANCE);
  await sb
    .from("members")
    .update({
      app_opens: opens,
      ...(ask ? { feedback_snooze_until: later(SNOOZE.asked) } : {}),
    })
    .eq("id", memberId);
  return ask;
}

export async function snoozeFeedback(memberId: string, days: number) {
  await supabaseAdmin()
    .from("members")
    .update({ feedback_snooze_until: later(days) })
    .eq("id", memberId);
}

const clip = (s: string | undefined) => {
  const t = (s ?? "").trim().slice(0, 1000);
  return t || null;
};

export async function addFeedback(f: {
  memberId: string;
  score: number;
  wish?: string;
  annoy?: string;
  source: "prompt" | "profile";
}): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from("feedback")
    .insert({
      member_id: f.memberId,
      score: f.score,
      wish: clip(f.wish),
      annoy: clip(f.annoy),
      source: f.source,
    })
    .select("id")
    .single();
  if (error) throw error;
  await snoozeFeedback(f.memberId, SNOOZE.answered);
  return data.id;
}

/** The texts come step by step after the score; only the author may add them. */
export async function updateFeedbackText(
  memberId: string,
  id: string,
  t: { wish?: string; annoy?: string },
) {
  const patch: { wish?: string | null; annoy?: string | null } = {};
  if (t.wish !== undefined) patch.wish = clip(t.wish);
  if (t.annoy !== undefined) patch.annoy = clip(t.annoy);
  const { error } = await supabaseAdmin()
    .from("feedback")
    .update(patch)
    .eq("id", id)
    .eq("member_id", memberId);
  if (error) throw error;
}

export type FeedbackEntry = {
  id: string;
  score: number;
  wish: string | null;
  annoy: string | null;
  source: "prompt" | "profile";
  at: string; // ISO
  name: string; // "Anna T." or "Gelöschtes Mitglied"
};

export async function listFeedback(): Promise<FeedbackEntry[]> {
  const { data, error } = await supabaseAdmin()
    .from("feedback")
    .select(
      "id, score, wish, annoy, source, created_at, members(first_name, last_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const m = r.members as { first_name: string; last_name: string } | null;
    return {
      id: r.id,
      score: r.score,
      wish: r.wish,
      annoy: r.annoy,
      source: r.source as "prompt" | "profile",
      at: r.created_at,
      name: m
        ? `${m.first_name}${m.last_name ? " " + m.last_name[0] + "." : ""}`
        : "Gelöschtes Mitglied",
    };
  });
}

export async function deleteFeedback(id: string) {
  const { error } = await supabaseAdmin()
    .from("feedback")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

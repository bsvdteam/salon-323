// SERVER-ONLY: points + rank for every member, computed from the members table
// alone (cuts and who invited whom). Small table, so one read and plain math.
import { supabaseAdmin } from "@/lib/supabase/server";
import { PTS, type Standing } from "@/lib/data";

/** Standing of every non-barber member, keyed by member id. Rank is by
 *  points (ties share the better place); inactive members aren't ranked. */
export async function loadStandings(): Promise<Map<string, Standing>> {
  const { data, error } = await supabaseAdmin()
    .from("members")
    .select("id, cuts, invited_by, is_barber, deactivated_at");
  if (error) throw error;
  const rows = (data ?? []).filter((m) => !m.is_barber);

  // people who already had a cut, grouped by who brought them in
  const kids = new Map<string, string[]>();
  for (const m of rows)
    if (m.invited_by && m.cuts > 0)
      (
        kids.get(m.invited_by) ?? kids.set(m.invited_by, []).get(m.invited_by)!
      ).push(m.id);

  const out = new Map<string, Standing>();
  for (const m of rows) {
    const direct = kids.get(m.id) ?? [];
    const second = direct.reduce((s, k) => s + (kids.get(k)?.length ?? 0), 0);
    const cutPts = m.cuts * PTS.cut;
    const invitePts = direct.length * PTS.invite;
    const circlePts = second * PTS.circle;
    out.set(m.id, {
      points: cutPts + invitePts + circlePts,
      cutPts,
      invitePts,
      circlePts,
      rank: 0,
      of: 0,
      top: 100,
    });
  }

  const ranked = rows
    .filter((m) => !m.deactivated_at)
    .map((m) => out.get(m.id)!)
    .sort((a, b) => b.points - a.points);
  ranked.forEach((s, i) => {
    s.rank =
      i && ranked[i - 1].points === s.points ? ranked[i - 1].rank : i + 1;
    s.of = ranked.length;
    s.top = Math.max(1, Math.ceil((s.rank / ranked.length) * 100));
  });
  return out;
}

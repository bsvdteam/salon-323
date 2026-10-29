// Maps the server AvailConfig (real dates) onto the client SalonState shape
// (day offsets from today) and back. Client-safe: the server import is type-only.
import { dateOf } from "@/lib/data";
import type { AvailConfig, DayRule } from "@/lib/db/availability";
import type { Absence, DayHours } from "@/components/salon/store";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** "YYYY-MM-DD" → day offset from today (0 = heute). */
function offOf(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.round(
    (new Date(y, m - 1, d).getTime() - dateOf(0).getTime()) / 86400000,
  );
}

export type AvailStatePatch = {
  week: Record<number, DayHours>;
  pause: { s: number; e: number };
  bufferMin: number;
  leadHours: number;
  ovr: Record<number, DayHours>;
  abs: Absence[];
};

export function availToState(c: AvailConfig): AvailStatePatch {
  const ovr: Record<number, DayHours> = {};
  for (const o of c.overrides)
    ovr[offOf(o.date)] = { on: o.on, s: o.s, e: o.e };
  return {
    week: c.week,
    pause: c.pause,
    bufferMin: c.bufferMin,
    leadHours: c.leadHours,
    ovr,
    abs: c.absences.map((a, i) => ({
      id: i + 1,
      a: offOf(a.start),
      b: offOf(a.end),
      why: a.why,
      src: a.src,
    })),
  };
}

export function stateToAvail(s: AvailStatePatch): AvailConfig {
  const rule = (r: DayHours): DayRule => ({ on: r.on, s: r.s, e: r.e });
  return {
    week: Object.fromEntries(
      Object.entries(s.week).map(([d, r]) => [Number(d), rule(r)]),
    ),
    pause: s.pause,
    bufferMin: s.bufferMin,
    leadHours: s.leadHours,
    overrides: Object.entries(s.ovr).map(([o, r]) => ({
      date: ymd(dateOf(Number(o))),
      ...rule(r),
    })),
    absences: s.abs.map((a) => ({
      start: ymd(dateOf(a.a)),
      end: ymd(dateOf(a.b)),
      why: a.why,
      src: a.src,
    })),
  };
}

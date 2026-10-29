"use client";

import { useEffect, useRef, useState } from "react";
import { useSalon } from "../../store";
import { useSalonActions } from "../../actions";
import {
  dateOf,
  labelOf,
  durOf,
  priceOf,
  svc,
  cuts as cutList,
  wdS,
  monS,
  fmtTime,
} from "@/lib/data";
import type { DayHours } from "../../store";
import { bookAppointmentAction } from "@/lib/actions";

export function BookTab() {
  const { state, set, say } = useSalon();
  const a = useSalonActions();
  const st = state;

  // ── echte Verfügbarkeit: belegte Zeiten aus dem Google-Kalender ──
  // "now" wird im Effect erfasst (nie im Render – das wäre eine unreine Funktion).
  const [avail, setAvail] = useState<{
    nowMs: number;
    busy: { s: number; e: number }[];
  } | null>(null);
  useEffect(() => {
    const nowMs = Date.now();
    const d2s = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    fetch(`/api/availability?from=${d2s(dateOf(0))}&to=${d2s(dateOf(14))}`)
      .then((r) => r.json())
      .then((j) =>
        setAvail({
          nowMs,
          busy: j?.ok
            ? j.busy.map((b: { start: string; end: string }) => ({
                s: new Date(b.start).getTime(),
                e: new Date(b.end).getTime(),
              }))
            : [],
        }),
      )
      .catch(() => setAvail({ nowMs, busy: [] }));
  }, []);

  // ── slot/day math ──
  const slotStartMs = (off: number, m: number) => {
    const d = dateOf(off);
    return (
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + m * 60000
    );
  };
  // Belegt, wenn der Slot zu bald/vorbei ist (Vorlaufzeit) oder einen
  // Kalendertermin (inkl. Puffer) überschneidet.
  const isTaken = (off: number, m: number) => {
    if (!avail) return false; // SSR/erste Render: alles frei -> kein Hydration-Mismatch
    const start = slotStartMs(off, m);
    const end = start + 30 * 60000;
    if (start < avail.nowMs + st.leadHours * 3600000) return true;
    const buf = st.bufferMin * 60000;
    return avail.busy.some((b) => b.s - buf < end && b.e + buf > start);
  };
  const PZ = st.pause;
  const slotsW = (w: DayHours | undefined) => {
    const r: number[] = [];
    if (!w || !w.on) return r;
    for (let m = w.s; m + 30 <= w.e; m += 30)
      if (m < PZ.s || m >= PZ.e) r.push(m);
    return r;
  };
  const dayW = (o: number) => st.ovr[o] ?? st.week[dateOf(o).getDay()];
  const slotsFor = (o: number) => slotsW(dayW(o));
  const isAbs = (o: number) => st.abs.some((ab) => o >= ab.a && o <= ab.b);
  const fmt = fmtTime;
  const dayOffs: number[] = [];
  for (let o = 0; o <= 14; o++)
    if (slotsFor(o).length && !isAbs(o)) dayOffs.push(o);
  const effDay = dayOffs.includes(st.day) ? st.day : (dayOffs[0] ?? 0);
  const slotMins = slotsFor(effDay);

  const t0b = dateOf(0).getDay();
  const lead = (t0b + 6) % 7;
  const gridOffs = Array.from({ length: 14 }, (_, i) => i - lead);
  const nextAbs = st.abs
    .filter((ab) => ab.b >= 1 && ab.a <= 14)
    .sort((x, y) => x.a - y.a)[0];
  const dlB = (o: number) => {
    const d = dateOf(o);
    return `${d.getDate()}. ${monS[d.getMonth()]}`;
  };
  const bookRange = `${dlB(0)} – ${dlB(14)} · 2 Wochen im Voraus`;
  const absNote = nextAbs
    ? `${nextAbs.why} ${nextAbs.a === nextAbs.b ? dlB(Math.max(1, nextAbs.a)) : dlB(Math.max(1, nextAbs.a)) + "–" + dlB(nextAbs.b)}`
    : "";

  const days = gridOffs.map((o) => {
    const d = dateOf(o);
    const on = effDay === o;
    const freeN = slotsFor(o).filter((m) => !isTaken(o, m)).length;
    const lvl = freeN > 10 ? 3 : freeN > 6 ? 2 : 1;
    const out = o < 0 || o > 14;
    const ab = !out && st.abs.find((x) => o >= x.a && o <= x.b);
    const closed = !out && !ab && !slotsFor(o).length;
    const full = !out && !ab && !closed && freeN === 0;
    const off = out || ab || closed || full;
    const tag = ab ? "ZU" : closed ? "" : full ? "VOLL" : "";
    if (off) {
      return {
        bf: "none",
        sh: "none",
        wd: wdS[d.getDay()],
        d: d.getDate(),
        pick: () => {},
        pe: "none" as const,
        o: out ? 0.22 : 0.5,
        bg: ab ? "rgba(229,119,108,.1)" : "transparent",
        fg: "#0E141C",
        border: ab ? "rgba(229,119,108,.25)" : "rgba(14,20,28,.08)",
        bars: [0, 1, 2].map(() => "transparent"),
        barsO: 0,
        tag,
        tagO: tag ? 1 : 0,
        tagC: ab ? "#B5483F" : "rgba(14,20,28,.6)",
      };
    }
    return {
      pe: "auto" as const,
      o: 1,
      barsO: 1,
      tag: "",
      tagO: 0,
      tagC: "transparent",
      bf: on ? "none" : "blur(22px) saturate(170%)",
      sh: on ? "inset 0 0 0 1px rgba(255,255,255,.08)" : "none",
      wd: wdS[d.getDay()],
      d: d.getDate(),
      pick: () => set({ day: o, time: null }),
      bg: on
        ? "linear-gradient(115deg,#151c28,#2a3444)"
        : "rgba(255,255,255,.42)",
      fg: on ? "#F4F7FA" : "#0E141C",
      border: on ? "transparent" : "rgba(255,255,255,.35)",
      bars: [0, 1, 2].map((k) =>
        k < lvl
          ? on
            ? "rgba(244,166,158,.9)"
            : "rgba(14,20,28,.45)"
          : on
            ? "rgba(255,255,255,.2)"
            : "rgba(14,20,28,.12)",
      ),
    };
  });

  const mkSlot = (m: number) => {
    const t = fmt(m);
    const taken = isTaken(effDay, m);
    const on = st.time === t;
    return {
      bf: on ? "none" : "blur(20px)",
      sh: on ? "inset 0 0 0 1px rgba(255,255,255,.08)" : "none",
      t,
      pick: () => set({ time: t }),
      pe: taken ? ("none" as const) : ("auto" as const),
      deco: taken ? "line-through" : "none",
      bg: on
        ? "linear-gradient(115deg,#151c28,#2a3444)"
        : taken
          ? "transparent"
          : "rgba(255,255,255,.42)",
      fg: on ? "#F4F7FA" : taken ? "rgba(14,20,28,.3)" : "#0E141C",
      border: on
        ? "transparent"
        : taken
          ? "rgba(14,20,28,.06)"
          : "rgba(255,255,255,.35)",
    };
  };
  const slotGroups = [
    { label: "Vormittag", slots: slotMins.filter((m) => m < PZ.s).map(mkSlot) },
    {
      label: "Nachmittag",
      slots: slotMins.filter((m) => m >= PZ.e).map(mkSlot),
    },
  ];

  // ── services / cut / template ──
  const services = svc.map((x) => {
    const on = st.sel.includes(x.k);
    return {
      ...x,
      toggle: () => a.toggleService(x.k),
      bf: on ? "none" : "blur(26px) saturate(170%)",
      bg: on
        ? "linear-gradient(115deg,#151c28,#2c3646 60%,#3a4556)"
        : "linear-gradient(160deg,rgba(255,255,255,.6),rgba(255,255,255,.28))",
      fg: on ? "#F4F7FA" : "#0E141C",
      shadow: on
        ? "inset 0 0 0 1px rgba(255,255,255,.08),0 24px 40px -24px rgba(10,20,40,.5)"
        : "inset 0 0 0 .5px rgba(255,255,255,.55)",
      dot: on ? "#F4A69E" : "transparent",
      dotBorder: on ? "rgba(244,166,158,.8)" : "rgba(14,20,28,.25)",
    };
  });
  const haareOn = st.sel.includes("haare");
  const cutOpts = cutList.map((c) => {
    const on = st.cut === c;
    return {
      l: c,
      pick: () => set({ cut: c }),
      bg: on
        ? "linear-gradient(115deg,#151c28,#2a3444)"
        : "rgba(255,255,255,.5)",
      fg: on ? "#F4F7FA" : "#0E141C",
      sh: on
        ? "inset 0 0 0 1px rgba(255,255,255,.08)"
        : "inset 0 0 0 .5px rgba(255,255,255,.7)",
    };
  });
  const firstVisit = !(st.history ?? []).length;
  const templateLabel = labelOf(st.template);
  const tplSame =
    st.sel.slice().sort().join() === st.template.slice().sort().join();

  // ── credit / price / summary ──
  const INV = st.invites ?? [];
  const credit = Math.max(
    0,
    INV.filter((i) => !i.pending).length * 5 - (st.creditUsed || 0),
  );
  const resch = st.rescheduling && st.appt;
  // Haarschnitt CHF 15, mit Bart CHF 20 (priceOf); Guthaben zieht davon ab.
  const base = priceOf(st.sel) || 15;
  const credApplied = resch ? 0 : Math.min(base, credit);
  const price = resch ? (st.appt!.price ?? base) : base - credApplied;
  const dd = dateOf(effDay);
  const canBook = !!(st.time && st.sel.length);
  const summaryWhen = `${wdS[dd.getDay()]} ${dd.getDate()}. ${monS[dd.getMonth()]} · ${st.time || "—"}`;
  const summaryWhat = st.sel.length
    ? `${labelOf(st.sel, st.cut)}${(st.history ?? []).length ? "" : " · Beratung"} · 30 min`
    : "Nichts gewählt";
  const slideLabel = !st.sel.length
    ? "Paket wählen"
    : !st.time
      ? "Uhrzeit wählen"
      : st.rescheduling
        ? "Zum Verschieben schieben"
        : "Zum Buchen schieben";

  // ── slide-to-book gesture ──
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ x0: number; max: number; dx: number } | null>(null);
  const EZ = "cubic-bezier(.22,1,.36,1)";

  const confirmBook = async () => {
    const d = dateOf(effDay);
    const bPrice = resch ? (st.appt!.price ?? base) : price;
    const p2 = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

    // "Zum Kalender"-Link für den Kunden (Google Calendar Template).
    const [bh, bm] = (st.time || "0:0").split(":").map(Number);
    const bStart = bh * 60 + bm;
    const gcal = (mins: number) =>
      `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(Math.floor(mins / 60))}${p2(mins % 60)}00`;
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Salon 323 — ${labelOf(st.sel, st.cut)}`,
    )}&dates=${gcal(bStart)}/${gcal(bStart + 30)}&ctz=Europe/Zurich`;

    // System of record = Supabase. Die Action legt den Termin in der DB an UND
    // spiegelt ihn (best effort) in den Google-Kalender – damit bleiben
    // Verfügbarkeit und Barber-Agenda (beide kalenderbasiert) konsistent.
    const res = await bookAppointmentAction({
      date: dateStr,
      time: st.time!,
      services: st.sel,
      cut: st.sel.includes("haare") ? st.cut : undefined,
      payMethod: "ort",
    });
    if (!res.ok) {
      say(
        res.error === "not_authenticated"
          ? "Bitte zuerst anmelden"
          : "Buchung fehlgeschlagen – bitte nochmal",
      );
      set({ slideDone: false });
      return;
    }

    set({
      appt: {
        off: effDay,
        time: st.time!,
        services: [...st.sel],
        price: bPrice,
        pay: "ort",
        eventId: res.bundle.upcoming?.google_event_id ?? undefined,
      },
      creditUsed: (st.creditUsed || 0) + (resch ? 0 : credApplied),
      booked: {
        pay: "ort",
        time: st.time!,
        when: `${["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][d.getDay()]}, ${d.getDate()}. ${["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][d.getMonth()]}`,
        what: `${labelOf(st.sel, st.cut)} · ${durOf(st.sel)} min · CHF ${bPrice}`,
        cal: calUrl,
      },
      rescheduling: false,
    });

    // Slot sofort lokal blockieren (bis der nächste Verfügbarkeits-Abruf kommt).
    const [hh, mm] = (st.time || "0:0").split(":").map(Number);
    const startMs = slotStartMs(effDay, hh * 60 + mm);
    setAvail((aa) =>
      aa
        ? { ...aa, busy: [...aa.busy, { s: startMs, e: startMs + 30 * 60000 }] }
        : aa,
    );
  };

  const slideDown = (e: React.PointerEvent) => {
    if (!st.time || !st.sel.length) return;
    const tr = trackRef.current;
    if (!tr) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (st.slideDone) return;
    drag.current = { x0: e.clientX, max: tr.clientWidth - 60, dx: 0 };
    if (knobRef.current) knobRef.current.style.transition = "none";
    if (fillRef.current) fillRef.current.style.transition = "none";
  };
  const slideMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = Math.max(
      0,
      Math.min(drag.current.max, e.clientX - drag.current.x0),
    );
    drag.current.dx = dx;
    if (knobRef.current)
      knobRef.current.style.transform = `translateX(${dx}px)`;
    if (fillRef.current) fillRef.current.style.width = 60 + dx + "px";
    if (labelRef.current)
      labelRef.current.style.opacity = String(
        Math.max(0, 1 - (dx / drag.current.max) * 1.6),
      );
  };
  const slideUp = () => {
    if (!drag.current) return;
    const d = drag.current;
    drag.current = null;
    const k = knobRef.current,
      fl = fillRef.current,
      l = labelRef.current;
    if (!k || !fl) return;
    if (d.dx > d.max * 0.8) {
      k.style.transition = `transform .45s ${EZ}`;
      fl.style.transition = `width .45s ${EZ}`;
      k.style.transform = `translateX(${d.max}px)`;
      fl.style.width = "100%";
      try {
        navigator.vibrate?.(12);
      } catch {}
      setTimeout(() => {
        k.style.transition = `transform .9s ${EZ} .15s`;
        k.style.transform = "translateX(0)";
        fl.style.transition = "opacity .5s ease";
        fl.style.opacity = "0";
        set({ slideDone: true });
      }, 420);
      setTimeout(() => confirmBook(), 1700);
    } else {
      k.style.transition = `transform .8s ${EZ}`;
      fl.style.transition = `width .8s ${EZ}`;
      k.style.transform = "translateX(0)";
      fl.style.width = "60px";
      if (l) l.style.opacity = "";
    }
  };

  const saveTemplate = () => {
    if (tplSame || !st.sel.length) return;
    set({ template: [...st.sel] });
    say("Vorlage gespeichert");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 30,
        paddingBottom: 250,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <span style={kick}>{st.rescheduling ? "Verschieben" : "Buchen"}</span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,4.4vw,40px)",
            fontWeight: 300,
            letterSpacing: "-.025em",
            lineHeight: 1.1,
          }}
        >
          Was dürfen wir tun?
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
          gap: "clamp(26px,4vw,40px)",
          alignItems: "start",
        }}
      >
        {/* left: package + cut + template */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={kick}>01 — Paket</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
              Immer 30 min
            </span>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {services.map((s) => (
              <button
                key={s.k}
                onClick={s.toggle}
                style={{
                  textAlign: "left",
                  aspectRatio: "1.3/1",
                  padding: 16,
                  borderRadius: 28,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backdropFilter: s.bf,
                  WebkitBackdropFilter: s.bf,
                  background: s.bg,
                  color: s.fg,
                  border: "1px solid transparent",
                  boxShadow: s.shadow,
                  transition: "all 1.1s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <span
                  style={{
                    alignSelf: "flex-end",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${s.dotBorder}`,
                    transition: "all .8s",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: s.dot,
                      transition: "all .8s",
                    }}
                  />
                </span>
                <span
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500 }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{s.sub}</span>
                </span>
              </button>
            ))}
          </div>

          {haareOn && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "4px 0 2px",
                animation: "up 1s cubic-bezier(.22,1,.36,1) both",
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                Schnitt
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cutOpts.map((c) => (
                  <button
                    key={c.l}
                    onClick={c.pick}
                    style={{
                      flex: "none",
                      height: 38,
                      padding: "0 16px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      border: 0,
                      background: c.bg,
                      color: c.fg,
                      boxShadow: c.sh,
                      transition: "all .9s cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    {c.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {firstVisit && (
            <div
              className="glass-solid"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                borderRadius: 24,
                animation: "up 1.2s cubic-bezier(.22,1,.36,1) both",
              }}
            >
              <span
                data-loop
                style={{
                  flex: "none",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#F4A69E",
                  animation: "ping 2.8s ease-out infinite",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Beratung inklusive
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.45,
                    color: "rgba(244,247,250,.65)",
                    textWrap: "pretty",
                  }}
                >
                  Beim ersten Besuch schauen wir zusammen, was zu dir passt.
                </span>
              </div>
            </div>
          )}

          <div
            className="glass-light"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 14px 14px 18px",
              borderRadius: 24,
              color: "#0E141C",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>Vorlage</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {templateLabel} · immer vorgewählt
              </span>
            </div>
            <button
              onClick={saveTemplate}
              style={{
                flex: "none",
                height: 36,
                borderRadius: 999,
                padding: "0 14px",
                fontSize: 11.5,
                transition: "all .8s cubic-bezier(.22,1,.36,1)",
                border: `1px solid ${tplSame ? "rgba(14,20,28,.14)" : "transparent"}`,
                background: tplSame ? "transparent" : "#0E141C",
                color: tplSame ? "rgba(14,20,28,.55)" : "#F4F7FA",
              }}
            >
              {tplSame ? "Aktiv ✓" : "Speichern"}
            </button>
          </div>
        </div>

        {/* right: day + time */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          <span style={kick}>02 — Tag</span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 10,
              marginTop: -6,
            }}
          >
            <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.72)" }}>
              {bookRange}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--ink-60)",
                opacity: nextAbs ? 1 : 0,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#E5776C",
                }}
              />
              {absNote}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,minmax(0,1fr))",
              gap: 6,
            }}
          >
            {days.map((d, i) => (
              <button
                key={i}
                onClick={d.pick}
                style={{
                  minWidth: 0,
                  height: 74,
                  padding: "9px 0 8px",
                  position: "relative",
                  borderRadius: 22,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: d.o,
                  pointerEvents: d.pe,
                  backdropFilter: d.bf,
                  WebkitBackdropFilter: d.bf,
                  background: d.bg,
                  boxShadow: d.sh,
                  color: d.fg,
                  border: `1px solid ${d.border}`,
                  transition: "all 1s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 8.5,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    opacity: 0.65,
                  }}
                >
                  {d.wd}
                </span>
                <span style={{ fontSize: 18, fontWeight: 300 }}>{d.d}</span>
                <span style={{ display: "flex", gap: 2, opacity: d.barsO }}>
                  {d.bars.map((b, j) => (
                    <span
                      key={j}
                      style={{
                        width: 4,
                        height: 2,
                        borderRadius: 2,
                        background: b,
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    position: "absolute",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 7,
                    letterSpacing: ".1em",
                    color: d.tagC,
                    bottom: 9,
                    opacity: d.tagO,
                  }}
                >
                  {d.tag}
                </span>
              </button>
            ))}
          </div>

          <span style={{ ...kick, paddingTop: 10 }}>03 — Zeit</span>
          {slotGroups.map((g) => (
            <div
              key={g.label}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {g.label}
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                  gap: 6,
                }}
              >
                {g.slots.map((t, i) => (
                  <button
                    key={i}
                    onClick={t.pick}
                    style={{
                      height: 42,
                      borderRadius: 16,
                      fontSize: 12,
                      fontFamily: "var(--font-geist-mono)",
                      backdropFilter: t.bf,
                      WebkitBackdropFilter: t.bf,
                      background: t.bg,
                      boxShadow: t.sh,
                      color: t.fg,
                      border: `1px solid ${t.border}`,
                      textDecoration: t.deco,
                      pointerEvents: t.pe,
                      transition: "all .9s cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    {t.t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* booking bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(86px + env(safe-area-inset-bottom))",
          zIndex: 19,
          display: "flex",
          justifyContent: "center",
          padding: "0 12px",
          pointerEvents: "none",
        }}
      >
        <div
          className="glass-dark"
          style={{
            pointerEvents: "auto",
            width: "min(440px,100%)",
            borderRadius: 30,
            padding: 12,
            // more opaque than the standard glass: the slots scroll underneath
            // this bar, and their text must not bleed through the summary
            background:
              "linear-gradient(115deg,rgba(9,13,22,.94),rgba(22,30,44,.9) 52%,rgba(30,40,58,.86))",
            animation: "up 1.4s cubic-bezier(.22,1,.36,1) .3s both",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "2px 6px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {summaryWhen}
              </span>
              <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.6)" }}>
                {summaryWhat}
              </span>
            </div>
            <span
              style={{
                flex: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 3,
                fontSize: 12,
                color: "rgba(244,247,250,.75)",
              }}
            >
              <span>{st.sel.length ? `CHF ${price}` : "—"}</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#F4A69E",
                  opacity: st.sel.length && credApplied ? 1 : 0,
                }}
              >
                {st.sel.length && credApplied ? `−${credApplied} Guthaben` : ""}
              </span>
            </span>
          </div>
          <span
            className="hide-short"
            style={{
              padding: "0 6px",
              fontSize: 10.5,
              color: "rgba(244,247,250,.55)",
            }}
          >
            Bezahlt wird vor Ort – bar oder TWINT.
          </span>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              ref={trackRef}
              style={{
                position: "relative",
                width: st.slideDone ? "60px" : "100%",
                height: 60,
                borderRadius: 999,
                background: "rgba(255,255,255,.06)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,.1),inset 0 1px 2px rgba(0,0,0,.25)",
                overflow: "hidden",
                opacity: canBook ? 1 : 0.5,
                transition:
                  "opacity .8s ease,width .9s cubic-bezier(.22,1,.36,1) .15s",
              }}
            >
              <span
                ref={fillRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 60,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.16))",
                }}
              />
              <span
                ref={labelRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: 40,
                  pointerEvents: "none",
                  opacity: st.slideDone ? 0 : 1,
                  transition: "opacity .4s ease",
                }}
              >
                <span
                  data-loop
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: ".02em",
                    color: "transparent",
                    background:
                      "linear-gradient(90deg,rgba(244,247,250,.38) 0%,rgba(244,247,250,.38) 35%,#fff 50%,rgba(244,247,250,.38) 65%,rgba(244,247,250,.38) 100%)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    animation: "shimmer 3.2s linear infinite",
                  }}
                >
                  {slideLabel}
                </span>
              </span>
              <div
                ref={knobRef}
                onPointerDown={slideDown}
                onPointerMove={slideMove}
                onPointerUp={slideUp}
                onPointerCancel={slideUp}
                style={{
                  position: "absolute",
                  left: 4,
                  top: 4,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#F4F7FA",
                  color: "#0E141C",
                  display: "grid",
                  placeItems: "center",
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  cursor: "grab",
                  boxShadow:
                    "0 8px 20px -8px rgba(0,0,0,.55),inset 0 -1px 2px rgba(0,0,0,.08)",
                  transition: "background .6s ease",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: "absolute",
                    opacity: st.slideDone ? 0 : 1,
                    transform: st.slideDone ? "translateX(8px)" : "none",
                    transition:
                      "opacity .35s ease,transform .5s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: "absolute" }}
                >
                  <path
                    d="M5 11.5l4 4 8-9"
                    strokeDasharray="20"
                    style={{
                      strokeDashoffset: st.slideDone ? 0 : 20,
                      transition:
                        "stroke-dashoffset .7s cubic-bezier(.22,1,.36,1) .45s",
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};

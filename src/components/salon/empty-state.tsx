"use client";

/**
 * A quiet, motion-driven empty state: two softly counter-rotating rings around a
 * breathing core, with an optional glyph. Used wherever there's simply nothing
 * yet (no members, no appointments, no revenue, no absences) so a screen never
 * falls back to a bare bar or blank space.
 *
 * tone adapts the palette to a light surface (glass-light cards) or a dark one
 * (glass-dark cards). Honours prefers-reduced-motion via the [data-loop] rule.
 */
export function EmptyState({
  title,
  sub,
  glyph,
  tone = "light",
  compact = false,
}: {
  title: string;
  sub?: string;
  glyph?: React.ReactNode;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const ink = tone === "dark" ? "#F4F7FA" : "#0E141C";
  const dim = tone === "dark" ? "rgba(244,247,250,.6)" : "rgba(14,20,28,.55)";
  const ring = tone === "dark" ? "rgba(255,255,255,.14)" : "rgba(14,20,28,.1)";
  const ring2 =
    tone === "dark" ? "rgba(244,166,158,.5)" : "rgba(229,119,108,.4)";
  const d = compact ? 76 : 104;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: compact ? 14 : 20,
        padding: compact ? "24px 20px" : "40px 24px",
        animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      <div
        style={{
          position: "relative",
          width: d,
          height: d,
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* outer ring, slow clockwise */}
        <span
          data-loop
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px dashed ${ring}`,
            animation: "orbit 26s linear infinite",
          }}
        />
        {/* inner ring, slow counter-clockwise with one coral arc */}
        <span
          data-loop
          style={{
            position: "absolute",
            inset: compact ? 14 : 20,
            borderRadius: "50%",
            border: `1.5px solid transparent`,
            borderTopColor: ring2,
            borderRightColor: ring2,
            animation: "orbitRev 14s linear infinite",
          }}
        />
        {/* breathing core */}
        <span
          data-loop
          style={{
            position: "absolute",
            width: compact ? 30 : 40,
            height: compact ? 30 : 40,
            borderRadius: "50%",
            background:
              tone === "dark"
                ? "radial-gradient(circle,rgba(244,166,158,.5),rgba(244,166,158,0) 70%)"
                : "radial-gradient(circle,rgba(229,119,108,.4),rgba(229,119,108,0) 70%)",
            animation: "softPulse 4.5s ease-in-out infinite",
          }}
        />
        <span
          style={{
            position: "relative",
            color: ink,
            display: "grid",
            placeItems: "center",
            fontSize: compact ? 15 : 18,
            opacity: 0.85,
          }}
        >
          {glyph}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxWidth: 300,
        }}
      >
        <span
          style={{
            fontSize: compact ? 15 : 17,
            fontWeight: 400,
            letterSpacing: "-.01em",
            color: ink,
          }}
        >
          {title}
        </span>
        {sub && (
          <span
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: dim,
              textWrap: "pretty",
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

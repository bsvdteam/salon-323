"use client";

/* Gradient placeholder for photos the owner delivers later (salon, cuts).
   Per the handoff: use tasteful gradients where a photo will go. */
export function ImageSlot({
  label,
  hue = 215,
  radius = 30,
  style,
}: {
  label?: string;
  hue?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  const strp =
    "repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1px,transparent 1px 13px)";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: `${strp}, radial-gradient(130% 110% at 30% 20%, oklch(0.62 0.03 ${hue + 30}), oklch(0.34 0.05 ${hue}))`,
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(90% 70% at 70% 90%, rgba(244,166,158,.18), transparent 60%)",
        }}
      />
      {label && (
        <span
          style={{
            position: "relative",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "rgba(244,247,250,.72)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

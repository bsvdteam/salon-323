"use client";

/* Stylized isometric 3D map in the Salon 323 palette. Not geographically exact —
   a real provider (e.g. Mapbox with a dark custom style, our coords + token) can
   drop in later. For now this reads as "here's the spot", on-brand. */

const TW = 46; // iso tile width
const TH = 23; // iso tile height (2:1)
const N = 7; // grid size

// deterministic pseudo-random so SSR and client match (no hydration mismatch)
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function IsoMap() {
  const W = 520;
  const H = 360;
  const ox = W / 2;
  const oy = 74;
  const salon = { gx: 3, gy: 3 };

  // back-to-front order
  const order: { gx: number; gy: number }[] = [];
  for (let s = 0; s < 2 * N - 1; s++)
    for (let gx = 0; gx < N; gx++) {
      const gy = s - gx;
      if (gy >= 0 && gy < N) order.push({ gx, gy });
    }

  const tiles = order.map(({ gx, gy }) => {
    const cx = ox + ((gx - gy) * TW) / 2;
    const cy = oy + ((gx + gy) * TH) / 2;
    const isSalon = gx === salon.gx && gy === salon.gy;
    const r = rnd(gx * 31 + gy * 17);
    const road = !isSalon && (r < 0.3 || gx === 1 || gy === 5);
    const h = isSalon
      ? 40
      : road
        ? 0
        : 14 + Math.floor(rnd(gx * 7 + gy * 13 + 3) * 44);

    const topPts = `${cx},${cy - TH / 2 - h} ${cx + TW / 2},${cy - h} ${cx},${cy + TH / 2 - h} ${cx - TW / 2},${cy - h}`;
    const leftPts = `${cx - TW / 2},${cy - h} ${cx},${cy + TH / 2 - h} ${cx},${cy + TH / 2} ${cx - TW / 2},${cy}`;
    const rightPts = `${cx},${cy + TH / 2 - h} ${cx + TW / 2},${cy - h} ${cx + TW / 2},${cy} ${cx},${cy + TH / 2}`;

    const top = isSalon ? "#f4a69e" : road ? "#1b2432" : "#39465c";
    const right = isSalon ? "#cf726b" : "#232d3d";
    const left = isSalon ? "#a1534d" : "#141b27";

    return (
      <g key={`${gx}-${gy}`}>
        {h > 0 && <polygon points={leftPts} fill={left} />}
        {h > 0 && <polygon points={rightPts} fill={right} />}
        <polygon
          points={topPts}
          fill={top}
          stroke={road ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.08)"}
          strokeWidth={road ? 1 : 0.6}
        />
        {isSalon && (
          <>
            {/* pin above the salon building */}
            <circle cx={cx} cy={cy - h - 70} r={26} fill="url(#pinGlow)" />
            <line
              x1={cx}
              y1={cy - h - 8}
              x2={cx}
              y2={cy - h - 58}
              stroke="#F4A69E"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle
              data-loop
              cx={cx}
              cy={cy - h - 62}
              r={9}
              fill="none"
              stroke="rgba(244,166,158,.7)"
              strokeWidth={1.4}
              style={{
                transformOrigin: `${cx}px ${cy - h - 62}px`,
                animation: "ping 2.8s ease-out infinite",
              }}
            />
            <circle
              cx={cx}
              cy={cy - h - 62}
              r={6}
              fill="#F4A69E"
              stroke="#0E141C"
              strokeWidth={2}
            />
          </>
        )}
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(244,166,158,.55)" />
          <stop offset="100%" stopColor="rgba(244,166,158,0)" />
        </radialGradient>
        <radialGradient id="mapFloor" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="rgba(120,146,178,.18)" />
          <stop offset="100%" stopColor="rgba(8,12,20,0)" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#mapFloor)" />
      {tiles}
    </svg>
  );
}

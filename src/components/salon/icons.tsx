"use client";

// Inline SVG icons, transcribed from the prototype icon() — no icon library (handoff rule).
const P: Record<string, React.ReactNode> = {
  home: <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />,
  book: (
    <>
      <rect x={4} y={5} width={16} height={15} rx={3} />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  card: (
    <>
      <rect x={3} y={6} width={18} height={12} rx={3} />
      <path d="M7 14h4" />
    </>
  ),
  circle: (
    <>
      <circle cx={12} cy={12} r={8} />
      <circle cx={12} cy={12} r={2.2} />
    </>
  ),
  today: (
    <>
      <circle cx={12} cy={12} r={8} />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  members: (
    <>
      <circle cx={9} cy={9} r={3.2} />
      <circle cx={17} cy={11} r={2.4} />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15 15.2c2.4-.3 4.6.9 5.5 3.3" />
    </>
  ),
  revenue: <path d="M5 19V13M10 19V8M15 19v-4M20 19V5" />,
  avail: (
    <>
      <rect x={4} y={5} width={16} height={15} rx={3} />
      <path d="M4 10h16M9 14.5l2 2 4-4" />
    </>
  ),
  cal: (
    <>
      <rect x={4} y={5} width={16} height={15} rx={3} />
      <path d="M4 10h16M9 3v4M15 3v4M8 14h2M8 17h5" />
    </>
  ),
};

export function Icon({
  k,
  size = 18,
}: {
  k: keyof typeof P | string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {P[k]}
    </svg>
  );
}

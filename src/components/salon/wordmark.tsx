"use client";

/* Geometric wordmark, path geometry transcribed 1:1 from the prototype glyphs(). */
const s = (x: number) =>
  `M${x + 31} 61C${x + 28} 56.5 ${x + 22} 55 ${x + 16} 55C${x + 7} 55 ${x + 1} 59.5 ${x + 1} 65.5C${x + 1} 72 ${x + 7} 74 ${x + 16} 75C${x + 25} 76 ${x + 31} 78.5 ${x + 31} 85C${x + 31} 91 ${x + 25} 95 ${x + 16} 95C${x + 9} 95 ${x + 3} 92.5 ${x + 0.5} 88`;
const o = (cx: number) => `M${cx} 54.5A20 20.5 0 1 1 ${cx - 0.01} 54.5`;
const a = (cx: number) => [o(cx), `M${cx + 20} 49.5V100.5`];
const l = (x: number) => `M${x} 28V100.5`;
const n = (x: number) =>
  `M${x} 100.5V49.5M${x} 73A18 18 0 0 1 ${x + 36} 73V100.5`;
const three = (x: number) =>
  `M${x + 2} 42C${x + 5} 37.5 ${x + 11} 35 ${x + 17.5} 35C${x + 26} 35 ${x + 32} 40.5 ${x + 32} 48C${x + 32} 56 ${x + 26} 62 ${x + 16} 62H${x + 13}M${x + 16} 62C${x + 28} 62 ${x + 35} 69 ${x + 35} 78.5C${x + 35} 88.5 ${x + 28} 95 ${x + 18} 95C${x + 10} 95 ${x + 4} 92 ${x + 1} 87`;
const two = (x: number) =>
  `M${x + 2} 47C${x + 2} 40 ${x + 9} 35 ${x + 18} 35C${x + 27} 35 ${x + 34} 41 ${x + 34} 49C${x + 34} 56 ${x + 30} 61 ${x + 24} 67L${x + 2} 95H${x + 35}`;

export function Wordmark({ style }: { style?: React.CSSProperties }) {
  const paths = [
    s(5),
    ...a(72),
    l(108),
    o(144),
    n(180),
    three(250),
    two(298),
    three(348),
  ];
  return (
    <svg
      viewBox="-4 24 396 82"
      style={{
        width: "clamp(148px,17.5vw,212px)",
        height: "auto",
        overflow: "visible",
        ...style,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={11}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-label="salon 323"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Logo323({ style }: { style?: React.CSSProperties }) {
  const paths = [three(0), two(44), three(88)];
  return (
    <svg
      viewBox="-6 26 136 76"
      style={{ width: 50, height: "auto", ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth={10}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-label="323"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

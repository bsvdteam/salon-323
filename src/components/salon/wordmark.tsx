"use client";

/* Geometric wordmark, path geometry transcribed 1:1 from the prototype glyphs(). */
const s = (x: number) =>
  `M${x + 31} 61C${x + 28} 56.5 ${x + 22} 55 ${x + 16} 55C${x + 7} 55 ${x + 1} 59.5 ${x + 1} 65.5C${x + 1} 72 ${x + 7} 74 ${x + 16} 75C${x + 25} 76 ${x + 31} 78.5 ${x + 31} 85C${x + 31} 91 ${x + 25} 95 ${x + 16} 95C${x + 9} 95 ${x + 3} 92.5 ${x + 0.5} 88`;
const o = (cx: number) => `M${cx} 54.5A20 20.5 0 1 1 ${cx - 0.01} 54.5`;
const a = (cx: number) => [o(cx), `M${cx + 20} 49.5V100.5`];
const l = (x: number) => `M${x} 28V100.5`;
const n = (x: number) =>
  `M${x} 100.5V49.5M${x} 73A18 18 0 0 1 ${x + 36} 73V100.5`;
// Digits share the cap line (35) and baseline (95) of the original 3 and 2;
// the 1's flag meets its stem in a sharp miter, the 5 ends like the 3 did.
const one = (x: number) => `M${x + 2} 47L${x + 17} 35V95`;
const five = (x: number) =>
  `M${x + 32} 35H${x + 6}L${x + 3} 63C${x + 7} 59.5 ${x + 12} 58 ${x + 18} 58C${x + 28} 58 ${x + 35} 65.5 ${x + 35} 76.5C${x + 35} 88 ${x + 28} 95 ${x + 18} 95C${x + 10} 95 ${x + 4} 92 ${x + 1} 87`;

export function Wordmark({ style }: { style?: React.CSSProperties }) {
  const paths = [s(5), ...a(72), l(108), o(144), n(180), one(250), five(284)];
  return (
    <svg
      viewBox="-4 24 332 82"
      style={{
        width: "clamp(124px,14.7vw,178px)",
        height: "auto",
        overflow: "visible",
        ...style,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={11}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-label="salon 15"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

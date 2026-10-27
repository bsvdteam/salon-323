import type { ReactNode } from "react";

// Layout-Klammer für alle öffentlichen (Marketing-)Seiten.
// Hier kommen später gemeinsame Elemente wie Header/Footer rein.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children;
}

// Client-side copy & share. Both must run synchronously inside the tap handler:
// iOS only grants clipboard/share access during the user gesture, so nothing
// may be awaited before calling these (that is why copying used to leave the
// clipboard empty).

/** Copy text; true when it reached the clipboard. */
export function copyText(text: string): boolean {
  // Legacy path first: synchronous, works everywhere incl. older iOS and
  // in-app browsers where navigator.clipboard is missing or blocked.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  ta.style.fontSize = "16px"; // no iOS zoom on focus
  document.body.appendChild(ta);
  const sel = document.getSelection();
  const prev = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  ta.focus({ preventScroll: true });
  ta.select();
  ta.setSelectionRange(0, text.length); // iOS ignores select()
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  if (prev && sel) {
    sel.removeAllRanges();
    sel.addRange(prev);
  }
  // Modern API as well (it is async, but started within the gesture).
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    ok = true;
  }
  return ok;
}

/** Native share sheet (WhatsApp, iMessage …) where available; otherwise the
 *  message is copied. Resolves to what happened. */
export async function shareText(data: {
  title?: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const full = data.url ? `${data.text}\n${data.url}` : data.text;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // share blocked (e.g. desktop without targets) → fall back to copy
    }
  }
  return copyText(full) ? "copied" : "failed";
}

/** Public invite link for a code — opens the code entry with it filled in. */
export function inviteUrl(code: string): string {
  return `${window.location.origin}/i/${code}`;
}

/** The message that goes with an invite (WhatsApp, iMessage …). The link is
 *  passed separately so share sheets render it as a preview card. */
export function inviteMessage(code: string): string {
  return (
    "Ich lade dich zu Salon 15 ein – ein Raum, ein Stuhl, ein Barber. " +
    "Rein kommt nur, wer eingeladen wird.\n\n" +
    `Dein Code: ${code}`
  );
}

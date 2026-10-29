// GET /api/wallet/pass — the logged-in member's Apple Wallet card, signed and
// served as a .pkpass. On iOS, opening this URL shows the "Add to Wallet" sheet.
// Backs the "Zur Wallet hinzufügen" button on the card tab.
import { getSession } from "@/lib/auth/session";
import { isAppleWalletConfigured } from "@/lib/wallet/apple/config";
import { buildMemberPass } from "@/lib/wallet/apple/pass";
import { memberPassData } from "@/lib/wallet/member-pass";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "member") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 401 });
  }

  // Before the Apple cert is installed, say so plainly instead of throwing.
  if (!isAppleWalletConfigured()) {
    return Response.json(
      { ok: false, error: "wallet_not_configured" },
      { status: 503 },
    );
  }

  const data = await memberPassData(s.mid);
  if (!data) {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    // The poster layout only for iOS 27+, everything else gets the proven
    // storeCard. Links point back to this deployment (salon15.ch).
    const ios = /(?:iPhone|iPad|iPod).*? OS (\d+)_/.exec(
      req.headers.get("user-agent") ?? "",
    );
    const buf = await buildMemberPass(data, {
      siteUrl: new URL(req.url).origin,
      poster: !!ios && Number(ios[1]) >= 27,
    });
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        // inline, not attachment: Safari then hands the pass straight to
        // Wallet ("Hinzufügen") like airline/booking tickets, instead of
        // saving a file to Downloads
        "Content-Disposition": `inline; filename="salon15-${data.memberNo}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[wallet] pass build failed:", e);
    return Response.json(
      { ok: false, error: "pass_build_failed" },
      { status: 500 },
    );
  }
}

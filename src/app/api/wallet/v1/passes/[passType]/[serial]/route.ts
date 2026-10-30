// PassKit web service: Wallet fetches the current pass after a push (or on
// pull-to-refresh). Same layout the member installed (pass_poster), 304 when
// nothing changed since If-Modified-Since.
import { appleWalletConfig } from "@/lib/wallet/apple/config";
import { hasPassAuth } from "@/lib/wallet/apple/token";
import { buildMemberPass } from "@/lib/wallet/apple/pass";
import { memberPassData } from "@/lib/wallet/member-pass";
import { getMemberById } from "@/lib/db/members";

type Ctx = { params: Promise<{ passType: string; serial: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: Ctx) {
  const { passType, serial } = await ctx.params;
  if (
    passType !== appleWalletConfig().passTypeIdentifier ||
    !/^[0-9a-f-]{36}$/i.test(serial) ||
    !hasPassAuth(req, serial)
  )
    return new Response(null, { status: 401 });

  const member = await getMemberById(serial);
  if (!member || member.is_barber) return new Response(null, { status: 404 });

  // HTTP dates have whole seconds
  const changed = Math.floor(new Date(member.pass_updated_at).getTime() / 1000);
  const since = Date.parse(req.headers.get("if-modified-since") ?? "");
  if (Number.isFinite(since) && Math.floor(since / 1000) >= changed)
    return new Response(null, { status: 304 });

  const data = await memberPassData(serial);
  if (!data) return new Response(null, { status: 404 });
  const buf = await buildMemberPass(data, {
    siteUrl: new URL(req.url).origin,
    poster: member.pass_poster,
  });
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": new Date(changed * 1000).toUTCString(),
      "Cache-Control": "no-store",
    },
  });
}

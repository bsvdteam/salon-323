// PassKit web service: which of this device's passes changed since the tag
// Wallet got last time (?passesUpdatedSince=<ms epoch>). No auth by spec.
import { appleWalletConfig } from "@/lib/wallet/apple/config";
import { updatedSerials } from "@/lib/wallet/apple/registrations";

type Ctx = { params: Promise<{ device: string; passType: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: Ctx) {
  const { device, passType } = await ctx.params;
  if (passType !== appleWalletConfig().passTypeIdentifier)
    return new Response(null, { status: 404 });
  const since = Number(
    new URL(req.url).searchParams.get("passesUpdatedSince") ?? 0,
  );
  const res = await updatedSerials(device, Number.isFinite(since) ? since : 0);
  if (!res) return new Response(null, { status: 204 });
  return Response.json({
    serialNumbers: res.serials,
    lastUpdated: String(res.lastUpdated),
  });
}

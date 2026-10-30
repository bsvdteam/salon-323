// PassKit web service: a device adds (POST) or removes (DELETE) a pass.
// Authorization: ApplePass <token of that pass>.
import { appleWalletConfig } from "@/lib/wallet/apple/config";
import { hasPassAuth } from "@/lib/wallet/apple/token";
import {
  registerDevice,
  unregisterDevice,
} from "@/lib/wallet/apple/registrations";

type Ctx = {
  params: Promise<{ device: string; passType: string; serial: string }>;
};

const UUID = /^[0-9a-f-]{36}$/i;

async function check(req: Request, ctx: Ctx) {
  const { device, passType, serial } = await ctx.params;
  const ok =
    passType === appleWalletConfig().passTypeIdentifier &&
    UUID.test(serial) &&
    hasPassAuth(req, serial);
  return ok ? { device, serial } : null;
}

export async function POST(req: Request, ctx: Ctx) {
  const p = await check(req, ctx);
  if (!p) return new Response(null, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    pushToken?: string;
  } | null;
  if (!body?.pushToken) return new Response(null, { status: 400 });
  const created = await registerDevice(p.device, p.serial, body.pushToken);
  return new Response(null, { status: created ? 201 : 200 });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const p = await check(req, ctx);
  if (!p) return new Response(null, { status: 401 });
  await unregisterDevice(p.device, p.serial);
  return new Response(null, { status: 200 });
}

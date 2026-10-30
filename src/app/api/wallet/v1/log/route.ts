// PassKit web service: Wallet reports problems with our service here.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    logs?: string[];
  } | null;
  for (const line of body?.logs ?? []) console.warn("[wallet log]", line);
  return new Response(null, { status: 200 });
}

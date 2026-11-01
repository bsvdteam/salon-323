import {
  loginMemberAction,
  loginBarberAction,
  redeemOnboardAction,
  logoutAction,
} from "@/lib/actions";

/**
 * Login / sign-up / logout as a plain fetch instead of a Server Action call.
 * A Server Action that sets or deletes a cookie makes Next re-render the route
 * the page was first opened on (e.g. /admin) and put that URL back — the app
 * switches screens on the client, so this fought the screen it had just shown
 * (address snapped back to /admin after logout; a login could land on a
 * redirect and rebuild the whole page). A route handler sets the same cookie
 * without touching the router.
 *   POST /api/auth  { op: "member" | "barber" | "onboard" | "logout", ... }
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  switch (b?.op) {
    case "member":
      return Response.json(
        await loginMemberAction(String(b.username ?? ""), b.pin ?? undefined),
      );
    case "barber":
      return Response.json(
        await loginBarberAction(
          String(b.username ?? ""),
          String(b.password ?? ""),
        ),
      );
    case "onboard":
      return Response.json(await redeemOnboardAction(b.args));
    case "logout":
      await logoutAction();
      return Response.json({ ok: true });
    default:
      return Response.json(
        { ok: false, error: "bad_request" },
        { status: 400 },
      );
  }
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";

// Hält die Supabase-Session bei jedem Request frisch (Token-Refresh).
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // Solange Supabase noch nicht konfiguriert ist (.env.local leer),
  // das Session-Refresh einfach überspringen, statt zu crashen.
  if (!isSupabaseConfigured) {
    return supabaseResponse;
  }

  let response = supabaseResponse;

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // WICHTIG: getUser() aufrufen, damit der Auth-Token erneuert wird.
  await supabase.auth.getUser();

  return response;
}

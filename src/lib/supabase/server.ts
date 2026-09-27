import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // A read-only CLI consumer has no request cookie store.
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null;
  if (process.env.SUPABASE_READ_TEST === "1") {
    try {
      cookieStore = await cookies();
    } catch {
      // Standalone read tests have no Next.js request context.
      cookieStore = null;
    }
  } else {
    cookieStore = await cookies();
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll() ?? [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore?.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies. Auth refresh is deferred.
          }
        },
      },
    },
  );
}

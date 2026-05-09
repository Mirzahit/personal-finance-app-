import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/__diag"];

function readSupabaseEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export async function proxy(request: NextRequest) {
  const { url: supabaseUrl, key: supabaseKey } = readSupabaseEnv();

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[proxy] Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables."
    );
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    console.error("[proxy] supabase.auth.getUser() failed:", err);
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};

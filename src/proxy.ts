import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle legacy or direct locale prefixes (/en, /fr, /ar, /en/..., /fr/..., /ar/...)
  const localeMatch = pathname.match(/^\/(en|fr|ar)(\/.*)?$/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const targetPath = localeMatch[2] || "/";
    const redirectUrl = new URL(targetPath, request.url);
    redirectUrl.search = request.nextUrl.search;
    const redirectRes = NextResponse.redirect(redirectUrl);
    redirectRes.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return redirectRes;
  }

  // 2. Handle common route aliases
  if (pathname === "/story" || pathname.startsWith("/story/")) {
    const newPath = pathname.replace(/^\/story/, "/stories");
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/stories") {
    return NextResponse.redirect(new URL("/explore" + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/login" + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/auth/signup") {
    return NextResponse.redirect(new URL("/register" + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/active-rounds") {
    return NextResponse.redirect(new URL("/rounds" + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/rankings") {
    return NextResponse.redirect(new URL("/leaderboards" + request.nextUrl.search, request.url), 301);
  }
  if (pathname === "/awards") {
    return NextResponse.redirect(new URL("/competitions" + request.nextUrl.search, request.url), 301);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Refresh Supabase authentication session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

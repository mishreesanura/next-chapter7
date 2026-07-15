import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasAuthSession(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token") ?? request.cookies.get("__Secure-authjs.session-token")
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_not-found") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isSignedIn = hasAuthSession(request);

  if (!isSignedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isSignedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};

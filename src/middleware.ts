import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // We check for the Warden App Session
  const appSession = request.cookies.get("warden_session_token");
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");

  // 1. If not logged in and trying to go to Dashboard -> Force to /auth
  if (!appSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // 2. If already logged in and trying to go back to /auth -> Force to Dashboard
  if (appSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

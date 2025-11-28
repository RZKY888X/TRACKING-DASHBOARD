import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Allow login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Protected routes
  const protectedPaths = ["/", "/admin", "/activity"];
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)  // ✅ Fixed
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE } from "./src/lib/auth/cookies";

const publicPaths = ["/", "/login", "/api/auth/login", "/api/auth/logout", "/api/auth/me"];
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/clients/:path*", "/invoices/:path*", "/api/(clients|invoices|payments)/:path*"],
};

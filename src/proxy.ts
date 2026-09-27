import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Fast, optimistic gate. Pages/actions still re-verify against the DB (requireAdmin / requireUser).
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("mv_session")?.value;
  let role: string | null = null;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      role = payload.role as string;
    } catch {}
  }
  const { pathname, search } = req.nextUrl;
  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "STAFF") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };

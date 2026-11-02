import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ht_session")?.value;
  const path = req.nextUrl.pathname;
  let role: string | null = null;
  if (token) {
    try {
      role = (await jwtVerify(token, secret())).payload.role as string;
    } catch {}
  }
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/pro", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/pro/:path*", "/admin/:path*"] };

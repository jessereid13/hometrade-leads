import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/client";
import { db } from "./db";

const COOKIE = "ht_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type Session = { userId: string; role: Role };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Returns the signed-in user with company, or redirects to /login. */
export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await db.user.findUnique({ where: { id: s.userId }, include: { company: true } });
  if (!user) redirect("/login");
  return user;
}

/** Pro area: must have completed onboarding. */
export async function requireCompany() {
  const user = await requireUser();
  if (!user.company) redirect("/pro/onboarding");
  return { user, company: user.company };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/pro");
  return user;
}

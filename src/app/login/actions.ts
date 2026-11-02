"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, verifyPassword, hashPassword, destroySession } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export type AuthState = { error?: string };

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "") || "/pro";
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Email or password didn't match." };
  await createSession({ userId: user.id, role: user.role });
  redirect(next.startsWith("/") ? next : "/pro");
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({ email: String(form.get("email") ?? "").toLowerCase().trim(), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "That email already has an account. Log in instead." };
  const user = await db.user.create({ data: { email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) } });
  await createSession({ userId: user.id, role: user.role });
  redirect("/pro/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

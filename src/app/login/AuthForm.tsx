"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "./actions";

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, {});
  return (
    <form action={action} className="card mx-auto grid max-w-sm gap-4">
      <h1 className="text-3xl font-extrabold">{mode === "login" ? "Pro log in" : "Create your pro account"}</h1>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-1"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="grid gap-1"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} /></div>
      {state.error && <p className="text-sm text-crit">{state.error}</p>}
      <button className="btn-primary justify-center" disabled={pending}>{pending ? "…" : mode === "login" ? "Log in" : "Continue"}</button>
      <p className="text-center text-sm text-[#5a6675]">
        {mode === "login" ? <>New here? <Link className="underline" href="/signup">Join as a pro</Link></> : <>Already have an account? <Link className="underline" href="/login">Log in</Link></>}
      </p>
    </form>
  );
}

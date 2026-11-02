"use client";
import { useActionState } from "react";
import type { Company } from "@/generated/prisma/client";
import { saveOnboarding, type ActionState } from "../actions";
import { TRADES, TRADE_LABEL } from "@/lib/trades";

export default function OnboardingForm({ company }: { company: Company | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveOnboarding, {});
  return (
    <form action={action} className="card mt-6 grid gap-5">
      <div className="grid gap-1"><label htmlFor="name">Company name</label><input id="name" name="name" defaultValue={company?.name ?? ""} placeholder="Rowe Plumbing Co." required /></div>
      <div className="grid gap-1"><label htmlFor="phone">Business phone (optional)</label><input id="phone" name="phone" type="tel" defaultValue={company?.phone ?? ""} /></div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Trades you want leads for</legend>
        <div className="flex flex-wrap gap-2">
          {TRADES.map((t) => (
            <label key={t} className="cursor-pointer rounded-full border border-[#cfd5de] px-3 py-1.5 font-semibold has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="checkbox" name="trades" value={t} defaultChecked={company?.trades.includes(t)} className="sr-only" />{TRADE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-1">
        <label htmlFor="serviceZips">Service ZIP codes</label>
        <textarea id="serviceZips" name="serviceZips" rows={3} defaultValue={company?.serviceZips.join(", ") ?? ""} placeholder="80202, 80203, 80210 …" />
        <span className="text-xs text-[#5a6675]">Comma or space separated. Add every ZIP you'll drive to.</span>
      </div>
      {state.error && <p className="text-sm text-crit">{state.error}</p>}
      <button className="btn-primary justify-center" disabled={pending}>{pending ? "Saving…" : company ? "Save changes" : "Continue to billing"}</button>
    </form>
  );
}

"use client";
import { useActionState } from "react";
import { submitQuote, type QuoteState } from "./actions";
import { TRADES, TRADE_LABEL } from "@/lib/trades";

export default function QuoteForm({ utmSource, utmCampaign }: { utmSource?: string; utmCampaign?: string }) {
  const [state, action, pending] = useActionState<QuoteState, FormData>(submitQuote, {});
  const err = (k: string) => state.errors?.[k]?.[0];
  return (
    <form action={action} className="card grid gap-4">
      <input type="hidden" name="utmSource" value={utmSource ?? ""} />
      <input type="hidden" name="utmCampaign" value={utmCampaign ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="trade">What do you need?</label>
          <select id="trade" name="trade" defaultValue="PLUMBING">
            {TRADES.map((t) => <option key={t} value={t}>{TRADE_LABEL[t]}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="urgency">How soon?</label>
          <select id="urgency" name="urgency" defaultValue="WEEK">
            <option value="NOW">It&apos;s an emergency</option>
            <option value="WEEK">This week</option>
            <option value="FLEX">I&apos;m flexible</option>
          </select>
        </div>
      </div>
      <div className="grid gap-1">
        <label htmlFor="title">Job in a few words</label>
        <input id="title" name="title" placeholder="Water heater leaking" />
        {err("title") && <span className="text-sm text-crit">{err("title")}</span>}
      </div>
      <div className="grid gap-1">
        <label htmlFor="description">Details</label>
        <textarea id="description" name="description" rows={4} placeholder="What's happening, how old is it, anything a pro should know" />
        {err("description") && <span className="text-sm text-crit">{err("description")}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1"><label htmlFor="homeownerName">Your name</label><input id="homeownerName" name="homeownerName" />{err("homeownerName") && <span className="text-sm text-crit">{err("homeownerName")}</span>}</div>
        <div className="grid gap-1"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" />{err("phone") && <span className="text-sm text-crit">{err("phone")}</span>}</div>
        <div className="grid gap-1"><label htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" /></div>
        <div className="grid gap-1"><label htmlFor="zip">ZIP</label><input id="zip" name="zip" inputMode="numeric" maxLength={5} />{err("zip") && <span className="text-sm text-crit">{err("zip")}</span>}</div>
      </div>
      <div className="grid gap-1"><label htmlFor="address">Street address (optional, helps pros quote)</label><input id="address" name="address" /></div>
      <p className="text-xs text-[#5a6675]">By submitting you agree to be contacted by up to three local pros about this job.</p>
      <button className="btn-primary justify-center" disabled={pending}>{pending ? "Sending…" : "Get quotes"}</button>
    </form>
  );
}

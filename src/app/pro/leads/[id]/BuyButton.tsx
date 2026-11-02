"use client";
import { useState, useTransition } from "react";
import { purchaseLead } from "../../actions";
import { money0 } from "@/lib/trades";

export default function BuyButton({ leadId, priceCents }: { leadId: string; priceCents: number }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (!confirm) return <button className="btn-primary" onClick={() => setConfirm(true)}>Buy for {money0(priceCents)}</button>;
  return (
    <div className="grid gap-2 text-right">
      <div className="flex gap-2">
        <button className="btn" onClick={() => setConfirm(false)} disabled={pending}>Cancel</button>
        <button className="btn-primary" disabled={pending} onClick={() => start(async () => { const r = await purchaseLead(leadId); if (r?.error) setError(r.error); })}>
          {pending ? "Buying…" : `Confirm ${money0(priceCents)}`}
        </button>
      </div>
      {error && <span className="text-sm text-crit">{error}</span>}
    </div>
  );
}

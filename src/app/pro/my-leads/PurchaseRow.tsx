"use client";
import { useState, useTransition } from "react";
import type { PurchaseStatus, RefundStatus } from "@/generated/prisma/client";
import { requestRefund, updatePurchaseStatus } from "../actions";

const STATUSES: Record<PurchaseStatus, string> = { NEW: "New", CALLED: "Called", QUOTED: "Quoted", WON: "Won", LOST: "Lost" };

export default function PurchaseRow(p: { id: string; status: PurchaseStatus; refund: RefundStatus | null; createdAt: string; trade: string; title: string; name: string; phone: string; zip: string; paid: string }) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string>();
  return (
    <tr>
      <td className="num whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
      <td><b>{p.trade}</b><br /><span className="text-[#5a6675]">{p.title}</span></td>
      <td>{p.name}</td>
      <td className="num whitespace-nowrap"><a className="underline" href={`tel:${p.phone.replace(/\D/g, "")}`}>{p.phone}</a></td>
      <td className="num">{p.zip}</td>
      <td className="num text-right">{p.paid}</td>
      <td>
        <select className="w-auto py-1 text-sm" defaultValue={p.status} disabled={pending} onChange={(e) => start(() => updatePurchaseStatus(p.id, e.target.value as PurchaseStatus))}>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td className="text-sm">
        {p.refund === "PENDING" ? <span className="text-[#5a6675]">Under review</span> : p.refund === "APPROVED" ? <span className="text-good">Credited</span> : p.refund === "DENIED" ? <span className="text-crit">Denied</span> : asking ? (
          <div className="grid gap-1">
            <input className="py-1 text-sm" placeholder="Reason (bad number, wrong trade…)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-1">
              <button className="btn btn-sm" onClick={() => setAsking(false)}>Cancel</button>
              <button className="btn-dark btn-sm" disabled={pending} onClick={() => start(async () => { const r = await requestRefund(p.id, reason); if (r.error) setErr(r.error); else setAsking(false); })}>Send</button>
            </div>
            {err && <span className="text-crit">{err}</span>}
          </div>
        ) : <button className="underline" onClick={() => setAsking(true)}>Request</button>}
      </td>
    </tr>
  );
}

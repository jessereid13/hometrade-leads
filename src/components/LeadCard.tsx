import Link from "next/link";
import type { Lead } from "@/generated/prisma/client";
import { TRADE_LABEL, money0, timeAgo } from "@/lib/trades";
import { TypePill, UrgencyPill } from "./Pills";

export default function LeadCard({ lead, owned }: { lead: Lead; owned?: boolean }) {
  const soldOut = lead.status !== "OPEN";
  return (
    <div className={`card grid gap-2.5 ${lead.urgency === "NOW" && !owned ? "border-accent" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-xl font-bold uppercase tracking-wide">{TRADE_LABEL[lead.trade]}</div>
          <div className="font-semibold">{lead.title}</div>
        </div>
        <div className="grid justify-items-end gap-1">
          {owned ? <span className="pill bg-good text-white">Yours</span> : <TypePill exclusive={lead.exclusive} />}
          <UrgencyPill u={lead.urgency} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-[#5a6675]">
        <span>ZIP <b className="num text-ink">{lead.zip}</b></span>
        <span>{timeAgo(lead.createdAt)}</span>
        <span>Est. job {money0(lead.estValueCents)}</span>
      </div>
      <p className="line-clamp-2 text-sm text-[#5a6675]">{lead.description}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e9ecf1] pt-2.5">
        <div>
          <span className="num text-xl font-semibold">{money0(lead.priceCents)}</span>
          {!lead.exclusive && <div className="text-xs text-[#5a6675]">{lead.soldCount} of {lead.maxSlots} spots taken</div>}
        </div>
        {owned ? (
          <Link className="btn btn-sm" href="/pro/my-leads">View contact</Link>
        ) : soldOut ? (
          <button className="btn btn-sm" disabled>Sold out</button>
        ) : (
          <Link className="btn-primary btn-sm" href={`/pro/leads/${lead.id}`}>View & buy</Link>
        )}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRADE_LABEL, money0, money, timeAgo } from "@/lib/trades";
import { TypePill, UrgencyPill } from "@/components/Pills";
import BuyButton from "./BuyButton";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany();
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) notFound();
  const purchase = await db.purchase.findUnique({ where: { leadId_companyId: { leadId: id, companyId: company.id } } });
  const canAfford = company.balanceCents >= lead.priceCents;
  const open = lead.status === "OPEN";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/pro" className="text-sm text-[#5a6675] underline">← Back to feed</Link>
      <div className="card mt-3 grid gap-4">
        <div>
          <div className="eyebrow">{TRADE_LABEL[lead.trade]} · {timeAgo(lead.createdAt)}</div>
          <h1 className="mt-1 text-3xl font-extrabold">{lead.title}</h1>
          <div className="mt-2 flex gap-2"><TypePill exclusive={lead.exclusive} /><UrgencyPill u={lead.urgency} /></div>
        </div>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_1fr]">
          <dt className="text-[#5a6675]">Area</dt><dd className="num">{lead.zip}{purchase && lead.address ? ` · ${lead.address}` : ""}</dd>
          <dt className="text-[#5a6675]">Homeowner</dt><dd>{purchase ? lead.homeownerName : <span className="select-none rounded bg-[#e9ecf1] text-transparent blur-sm">Jane Homeowner</span>}</dd>
          <dt className="text-[#5a6675]">Phone</dt><dd className="num">{purchase ? lead.phone : <span className="select-none rounded bg-[#e9ecf1] text-transparent blur-sm">(555) 555-5555</span>}</dd>
          {purchase && lead.email && <><dt className="text-[#5a6675]">Email</dt><dd>{lead.email}</dd></>}
          <dt className="text-[#5a6675]">Details</dt><dd>{lead.description}</dd>
          <dt className="text-[#5a6675]">Est. job value</dt><dd className="num">{money0(lead.estValueCents)}</dd>
          <dt className="text-[#5a6675]">Source</dt><dd>{lead.source}{lead.utmSource ? ` · ${lead.utmSource}` : ""}{lead.phoneVerified ? " · phone verified" : ""}</dd>
          {!lead.exclusive && <><dt className="text-[#5a6675]">Spots</dt><dd>{lead.soldCount} of {lead.maxSlots} taken</dd></>}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ecf1] pt-4">
          <div><span className="num text-2xl font-semibold">{money0(lead.priceCents)}</span><div className="text-xs text-[#5a6675]">Your balance: {money(company.balanceCents)}</div></div>
          {purchase ? (
            <Link className="btn-dark" href="/pro/my-leads">You own this lead</Link>
          ) : !open ? (
            <button className="btn" disabled>Sold out</button>
          ) : canAfford ? (
            <BuyButton leadId={lead.id} priceCents={lead.priceCents} />
          ) : (
            <Link className="btn-primary" href="/pro/billing">Add funds to buy</Link>
          )}
        </div>
        <p className="text-xs text-[#5a6675]">Name and number unlock after purchase. Refund credit within 72 hours if the number doesn&apos;t connect, the job is outside your trade, or the homeowner already hired someone.</p>
      </div>
    </div>
  );
}

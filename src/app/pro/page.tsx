import Link from "next/link";
import type { Trade, Urgency } from "@/generated/prisma/client";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRADE_LABEL } from "@/lib/trades";
import LeadCard from "@/components/LeadCard";

export const dynamic = "force-dynamic";

export default async function Feed({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { company } = await requireCompany();
  const trade = company.trades.includes(sp.trade as Trade) ? (sp.trade as Trade) : undefined;
  const urgency = ["NOW", "WEEK", "FLEX"].includes(sp.urgency ?? "") ? (sp.urgency as Urgency) : undefined;
  const type = sp.type === "ex" ? true : sp.type === "sh" ? false : undefined;

  const [leads, owned] = await Promise.all([
    db.lead.findMany({
      where: {
        status: "OPEN",
        trade: trade ?? { in: company.trades },
        zip: company.serviceZips.length ? { in: company.serviceZips } : undefined,
        ...(urgency && { urgency }),
        ...(type !== undefined && { exclusive: type }),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.purchase.findMany({ where: { companyId: company.id }, select: { leadId: true } }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.leadId));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow">Live feed</div><h1 className="mt-1 text-4xl font-extrabold">Leads in your service area</h1></div>
        <Link className="btn btn-sm" href="/pro/onboarding">Edit trades & ZIPs</Link>
      </div>
      <form className="mt-4 flex flex-wrap items-center gap-2 [&>select]:w-auto">
        <select name="trade" defaultValue={trade ?? ""}><option value="">All my trades</option>{company.trades.map((t) => <option key={t} value={t}>{TRADE_LABEL[t]}</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""}><option value="">Exclusive + shared</option><option value="ex">Exclusive only</option><option value="sh">Shared only</option></select>
        <select name="urgency" defaultValue={urgency ?? ""}><option value="">Any urgency</option><option value="NOW">Emergency</option><option value="WEEK">This week</option><option value="FLEX">Flexible</option></select>
        <button className="btn btn-sm">Filter</button>
        <span className="ml-auto text-sm text-[#5a6675]">{leads.length} open lead{leads.length === 1 ? "" : "s"}</span>
      </form>
      {leads.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-[#cfd5de] p-10 text-center text-[#5a6675]">
          No open leads match right now. You&apos;ll get an email the moment one lands in your ZIPs.
        </div>
      ) : (
        <div className="mt-4 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((l) => <LeadCard key={l.id} lead={l} owned={ownedIds.has(l.id)} />)}
        </div>
      )}
    </div>
  );
}

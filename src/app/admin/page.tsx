import { db } from "@/lib/db";
import { TRADE_LABEL, money0 } from "@/lib/trades";
import { TRADES } from "@/lib/trades";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const since = new Date(Date.now() - 30 * 864e5);
  const [leads, purchases, refunds, buyers, topups] = await Promise.all([
    db.lead.groupBy({ by: ["trade"], where: { createdAt: { gte: since } }, _count: true }),
    db.purchase.groupBy({ by: ["leadId"], where: { createdAt: { gte: since } }, _sum: { priceCents: true } }),
    db.refundRequest.count({ where: { createdAt: { gte: since }, status: "APPROVED" } }),
    db.company.count(),
    db.transaction.aggregate({ where: { type: "TOPUP", createdAt: { gte: since } }, _sum: { amountCents: true } }),
  ]);
  const leadCount = leads.reduce((s, l) => s + l._count, 0);
  const revenue = purchases.reduce((s, p) => s + (p._sum.priceCents ?? 0), 0);
  const sold = purchases.length;
  const byTrade = await db.purchase.findMany({ where: { createdAt: { gte: since } }, select: { priceCents: true, lead: { select: { trade: true } } } });
  const rev: Record<string, number> = {};
  for (const p of byTrade) rev[p.lead.trade] = (rev[p.lead.trade] ?? 0) + p.priceCents;
  const max = Math.max(1, ...Object.values(rev));
  const open = await db.lead.count({ where: { status: "OPEN" } });

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Last 30 days</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="tile"><div className="v">{money0(revenue)}</div><div className="k">lead revenue</div></div>
        <div className="tile"><div className="v">{money0(topups._sum.amountCents ?? 0)}</div><div className="k">funds loaded</div></div>
        <div className="tile"><div className="v">{leadCount}</div><div className="k">leads generated</div></div>
        <div className="tile"><div className="v">{leadCount ? Math.round((sold / leadCount) * 100) + "%" : "—"}</div><div className="k">sell-through</div></div>
        <div className="tile"><div className="v">{sold ? ((refunds / sold) * 100).toFixed(1) + "%" : "—"}</div><div className="k">refund rate</div></div>
        <div className="tile"><div className="v">{buyers}</div><div className="k">buyers · {open} open leads</div></div>
      </div>
      <div className="card mt-6">
        <h2 className="text-xl font-bold">Revenue by trade</h2>
        <div className="mt-3 grid gap-2">
          {TRADES.map((t) => (
            <div key={t} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-sm">
              <span>{TRADE_LABEL[t]}</span>
              <div className="h-3.5 rounded-sm bg-accent" style={{ width: `${((rev[t] ?? 0) / max) * 100}%` }} />
              <span className="num text-right">{money0(rev[t] ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

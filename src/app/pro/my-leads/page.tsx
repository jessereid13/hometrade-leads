import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRADE_LABEL, money, money0 } from "@/lib/trades";
import PurchaseRow from "./PurchaseRow";

export const dynamic = "force-dynamic";

export default async function MyLeads({ searchParams }: { searchParams: Promise<{ bought?: string }> }) {
  const sp = await searchParams;
  const { company } = await requireCompany();
  const purchases = await db.purchase.findMany({ where: { companyId: company.id }, include: { lead: true, refund: true }, orderBy: { createdAt: "desc" } });
  const spent = purchases.reduce((s, p) => s + p.priceCents, 0);
  const won = purchases.filter((p) => p.status === "WON");
  const wonValue = won.reduce((s, p) => s + p.lead.estValueCents, 0);

  return (
    <div>
      <div className="eyebrow">Buyer dashboard</div>
      <h1 className="mt-1 text-4xl font-extrabold">{company.name}</h1>
      {sp.bought && <div className="mt-3 rounded-md bg-good/10 px-4 py-2 text-sm font-semibold text-good">Lead bought. Contact details are below. Call within five minutes for the best close rate.</div>}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="tile"><div className="v">{money(company.balanceCents)}</div><div className="k">balance</div></div>
        <div className="tile"><div className="v">{purchases.length}</div><div className="k">leads bought</div></div>
        <div className="tile"><div className="v">{money0(spent)}</div><div className="k">spent on leads</div></div>
        <div className="tile"><div className="v">{purchases.length ? Math.round((won.length / purchases.length) * 100) + "%" : "—"}</div><div className="k">close rate</div></div>
        <div className="tile"><div className="v">{spent && wonValue ? (wonValue / spent).toFixed(1) + "x" : "—"}</div><div className="k">job value per $1 of leads</div></div>
      </div>
      {purchases.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-[#cfd5de] p-10 text-center text-[#5a6675]">You haven&apos;t bought a lead yet.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="table bg-white">
            <thead><tr><th>Bought</th><th>Trade / job</th><th>Homeowner</th><th>Phone</th><th>ZIP</th><th className="text-right">Paid</th><th>Status</th><th>Refund</th></tr></thead>
            <tbody>
              {purchases.map((p) => (
                <PurchaseRow key={p.id} id={p.id} status={p.status} refund={p.refund?.status ?? null} createdAt={p.createdAt.toISOString()}
                  trade={TRADE_LABEL[p.lead.trade]} title={p.lead.title} name={p.lead.homeownerName} phone={p.lead.phone} zip={p.lead.zip} paid={money0(p.priceCents)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

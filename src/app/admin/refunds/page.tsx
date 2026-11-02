import { db } from "@/lib/db";
import { TRADE_LABEL, money0 } from "@/lib/trades";
import { resolveRefund } from "../actions";

export const dynamic = "force-dynamic";

export default async function Refunds() {
  const rs = await db.refundRequest.findMany({ include: { purchase: { include: { lead: true, company: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Refund requests</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="table bg-white">
          <thead><tr><th>Requested</th><th>Buyer</th><th>Lead</th><th>Reason</th><th className="text-right">Amount</th><th>Decision</th></tr></thead>
          <tbody>
            {rs.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[#5a6675]">No refund requests.</td></tr>}
            {rs.map((r) => (
              <tr key={r.id}>
                <td className="num whitespace-nowrap">{r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                <td>{r.purchase.company.name}</td>
                <td><b>{TRADE_LABEL[r.purchase.lead.trade]}</b> · {r.purchase.lead.title}<br /><span className="num text-xs text-[#5a6675]">{r.purchase.lead.phone}</span></td>
                <td className="max-w-xs">{r.reason}</td>
                <td className="num text-right">{money0(r.purchase.priceCents)}</td>
                <td>
                  {r.status === "PENDING" ? (
                    <div className="flex gap-1">
                      <form action={resolveRefund.bind(null, r.id, true)}><button className="btn-dark btn-sm">Approve</button></form>
                      <form action={resolveRefund.bind(null, r.id, false)}><button className="btn btn-sm">Deny</button></form>
                    </div>
                  ) : <span className={r.status === "APPROVED" ? "text-good" : "text-crit"}>{r.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import { TRADE_LABEL, money } from "@/lib/trades";
import { adjustBalance } from "../actions";

export const dynamic = "force-dynamic";

export default async function Buyers() {
  const companies = await db.company.findMany({
    include: { owner: { select: { email: true } }, purchases: { select: { priceCents: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Buyers</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="table bg-white">
          <thead><tr><th>Company</th><th>Trades</th><th>ZIPs</th><th className="text-right">Balance</th><th className="text-right">Spent</th><th className="text-right">Close rate</th><th>Credit</th></tr></thead>
          <tbody>
            {companies.map((c) => {
              const spent = c.purchases.reduce((s, p) => s + p.priceCents, 0);
              const won = c.purchases.filter((p) => p.status === "WON").length;
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b><br /><span className="text-xs text-[#5a6675]">{c.owner.email}</span></td>
                  <td className="text-[#5a6675]">{c.trades.map((t) => TRADE_LABEL[t]).join(", ")}</td>
                  <td className="num text-xs text-[#5a6675]">{c.serviceZips.length} ZIPs</td>
                  <td className="num text-right">{money(c.balanceCents)}</td>
                  <td className="num text-right">{money(spent)}</td>
                  <td className="num text-right">{c.purchases.length ? Math.round((won / c.purchases.length) * 100) + "%" : "—"}</td>
                  <td>
                    <form action={async (f: FormData) => { "use server"; await adjustBalance(c.id, Math.round(Number(f.get("amt")) * 100), String(f.get("note") ?? "")); }} className="flex gap-1">
                      <input name="amt" type="number" step="1" placeholder="$" className="num w-20 py-1 text-sm" />
                      <input name="note" placeholder="note" className="w-28 py-1 text-sm" />
                      <button className="btn btn-sm">Apply</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

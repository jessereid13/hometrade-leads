import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, money0 } from "@/lib/trades";
import { TOPUP_TIERS } from "@/lib/stripe";
import { startTopup } from "../actions";

export const dynamic = "force-dynamic";

export default async function Billing({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { company } = await requireCompany();
  const tx = await db.transaction.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" }, take: 30 });
  const LABEL = { TOPUP: "Added funds", PURCHASE: "Lead purchase", REFUND: "Refund credit", ADJUSTMENT: "Adjustment" } as const;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="eyebrow">{sp.welcome ? "Step 2 of 2" : "Billing"}</div>
      <h1 className="mt-1 text-4xl font-extrabold">{sp.welcome ? "Load your starting balance" : "Balance & history"}</h1>
      {sp.success && <p className="mt-3 rounded-md bg-good/10 px-4 py-2 text-sm font-semibold text-good">Payment received. Your balance updates within a few seconds.</p>}
      {sp.canceled && <p className="mt-3 text-sm text-[#5a6675]">Checkout canceled. Nothing was charged.</p>}
      <div className="card mt-4">
        <div className="text-sm text-[#5a6675]">Current balance</div>
        <div className="num text-4xl font-semibold">{money(company.balanceCents)}</div>
      </div>
      <form action={startTopup} className="mt-4 grid gap-3 sm:grid-cols-3">
        {TOPUP_TIERS.map((t, i) => (
          <button key={i} name="tier" value={i} className="card text-left hover:border-accent">
            <div className="font-display text-3xl font-extrabold">{money0(t.amountCents)}</div>
            <div className="text-sm text-[#5a6675]">about {Math.round(t.amountCents / 3800)} leads</div>
            <div className={`text-xs font-semibold ${t.bonusCents ? "text-good" : "text-[#5a6675]"}`}>{t.bonusCents ? `+ ${money0(t.bonusCents)} bonus credit` : "no bonus"}</div>
          </button>
        ))}
      </form>
      <p className="mt-2 text-xs text-[#5a6675]">Secure checkout by Stripe. No subscription; funds never expire.</p>
      {tx.length > 0 && (
        <table className="table mt-6 bg-white">
          <thead><tr><th>Date</th><th>Type</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{tx.map((t) => (
            <tr key={t.id}><td className="num">{t.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td><td>{LABEL[t.type]}</td><td className={`num text-right ${t.amountCents < 0 ? "" : "text-good"}`}>{money(t.amountCents)}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

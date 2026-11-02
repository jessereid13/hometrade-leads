import Link from "next/link";
import { db } from "@/lib/db";
import { getAllRules } from "@/lib/pricing";
import { TRADE_LABEL, money0, timeAgo } from "@/lib/trades";

export const dynamic = "force-dynamic";

const JOBS: Record<string, string> = {
  HVAC: "Furnace / AC replacement", PLUMBING: "Water heater, leaks, drains", ROOFING: "Repair or full replacement",
  ELECTRICAL: "Panel upgrade, EV charger", CLEANING: "Recurring or move-out clean", LANDSCAPING: "Sod, hardscape, cleanup", PEST: "Termite, rodent, quarterly",
};

export default async function Home() {
  const [rules, recent, delivered] = await Promise.all([
    getAllRules(),
    db.lead.findMany({ where: { status: { in: ["OPEN", "SOLD_OUT"] } }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.purchase.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
  ]);
  return (
    <div className="grid gap-12">
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="eyebrow">Pay-per-lead for home service pros</div>
          <h1 className="mt-2 text-5xl font-extrabold md:text-6xl">Homeowners who need a quote. Not a directory listing.</h1>
          <p className="mt-4 max-w-xl text-lg text-[#5a6675]">
            We run the ads, the forms and the phone screening. You get the homeowner&apos;s name, number and job details the minute they ask for help, and you only pay for the leads you take.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">Start buying leads</Link>
            <Link href="/quote" className="btn">I&apos;m a homeowner</Link>
          </div>
        </div>
        <div className="grid gap-2 rounded-md bg-ink p-4 text-white">
          <div className="flex justify-between text-xs uppercase tracking-widest opacity-70">
            <span>Recent leads</span><span>{delivered} sold in 30 days</span>
          </div>
          {recent.length === 0 && <div className="text-sm opacity-70">No leads yet. Run <code>npm run db:seed</code> for samples.</div>}
          {recent.map((l) => (
            <div key={l.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{TRADE_LABEL[l.trade]}</span>
              <span className="num text-xs opacity-75">{l.zip} · {timeAgo(l.createdAt)}</span>
              <span className="num font-semibold text-accent">{money0(l.priceCents)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow">How it works</div>
        <h2 className="mt-1 text-3xl font-bold">Three steps from signup to your first job</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Pick your trades and ZIPs", "Tell us what you do and where you drive. Leads outside your map never show up."],
            ["Buy leads one at a time", "Every lead shows job type, urgency and area before you pay. Exclusive leads go to you only; shared leads to at most three pros."],
            ["Call within five minutes", "Contact details unlock the moment you buy. Bad number or wrong trade? Request a credit and we refund it."],
          ].map(([h, p]) => (
            <div key={h} className="border-t-4 border-accent bg-white p-4">
              <h3 className="text-xl font-bold">{h}</h3>
              <p className="mt-1 text-[#5a6675]">{p}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow">Pricing</div>
        <h2 className="mt-1 text-3xl font-bold">What a lead costs</h2>
        <p className="mt-2 max-w-xl text-[#5a6675]">No monthly fee. Load a balance, spend it on leads. Emergencies and large jobs price higher.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="table bg-white">
            <thead><tr><th>Trade</th><th>Typical job</th><th className="text-right">Exclusive</th><th className="text-right">Shared (max 3)</th><th className="text-right">Avg ticket</th></tr></thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.trade}>
                  <td className="font-semibold">{TRADE_LABEL[r.trade]}</td>
                  <td className="text-[#5a6675]">{JOBS[r.trade]}</td>
                  <td className="num text-right">{money0(r.exclusiveCents)}</td>
                  <td className="num text-right">{money0(r.sharedCents)}</td>
                  <td className="num text-right">{money0(r.avgTicketCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

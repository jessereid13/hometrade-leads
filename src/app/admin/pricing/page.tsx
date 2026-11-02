import { getAllRules } from "@/lib/pricing";
import { TRADE_LABEL } from "@/lib/trades";
import { savePricing } from "../actions";

export const dynamic = "force-dynamic";

export default async function Pricing() {
  const rules = await getAllRules();
  const Field = ({ name, value, step = 1 }: { name: string; value: number; step?: number }) => (
    <input name={name} type="number" step={step} defaultValue={value} className="num w-24 py-1 text-right text-sm" />
  );
  return (
    <form action={savePricing}>
      <h1 className="text-3xl font-extrabold">Pricing rules</h1>
      <p className="mt-1 text-sm text-[#5a6675]">Applies to new leads. Price = base × emergency multiplier (if emergency) × big-job multiplier (if est. value ≥ threshold), rounded to the dollar.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="table bg-white">
          <thead><tr><th>Trade</th><th>Exclusive $</th><th>Shared $</th><th>Shared slots</th><th>Emergency ×</th><th>Big job ×</th><th>Big job ≥ $</th></tr></thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.trade}>
                <td className="font-semibold">{TRADE_LABEL[r.trade]}</td>
                <td><Field name={`${r.trade}.ex`} value={r.exclusiveCents / 100} /></td>
                <td><Field name={`${r.trade}.sh`} value={r.sharedCents / 100} /></td>
                <td><Field name={`${r.trade}.slots`} value={r.sharedSlots} /></td>
                <td><Field name={`${r.trade}.emerg`} value={r.emergencyMult} step={0.05} /></td>
                <td><Field name={`${r.trade}.big`} value={r.bigJobMult} step={0.05} /></td>
                <td><Field name={`${r.trade}.thresh`} value={r.bigJobThresholdCents / 100} step={100} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary mt-4">Save pricing</button>
    </form>
  );
}

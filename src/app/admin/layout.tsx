import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const tabs = [["/admin", "Overview"], ["/admin/leads", "Leads"], ["/admin/refunds", "Refunds"], ["/admin/buyers", "Buyers"], ["/admin/pricing", "Pricing"]];
  return (
    <div>
      <div className="eyebrow">Operator console</div>
      <nav className="mt-2 flex flex-wrap gap-1 border-b border-[#cfd5de]">
        {tabs.map(([href, label]) => <Link key={href} href={href} className="px-3 py-2 text-sm font-semibold hover:bg-white">{label}</Link>)}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}

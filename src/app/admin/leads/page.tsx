import { db } from "@/lib/db";
import { TRADE_LABEL, URGENCY_LABEL, money0, timeAgo } from "@/lib/trades";
import { setLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 150, include: { _count: { select: { purchases: true } } } });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">All leads</h1>
        <p className="text-sm text-[#5a6675]">Reject spam or test leads; close ones the homeowner withdrew.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="table bg-white">
          <thead><tr><th>In</th><th>Trade / job</th><th>Homeowner</th><th>ZIP</th><th>Urgency</th><th>Type</th><th className="text-right">Price</th><th>Sold</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-[#5a6675]">{timeAgo(l.createdAt)}</td>
                <td><b>{TRADE_LABEL[l.trade]}</b><br /><span className="text-[#5a6675]">{l.title}</span></td>
                <td>{l.homeownerName}<br /><span className="num text-xs text-[#5a6675]">{l.phone}</span></td>
                <td className="num">{l.zip}</td>
                <td>{URGENCY_LABEL[l.urgency]}</td>
                <td>{l.exclusive ? "Exclusive" : `Shared ×${l.maxSlots}`}</td>
                <td className="num text-right">{money0(l.priceCents)}</td>
                <td className="num">{l._count.purchases}</td>
                <td className="text-[#5a6675]">{l.source}{l.utmCampaign ? ` · ${l.utmCampaign}` : ""}</td>
                <td>
                  <div className="flex gap-1">
                    <span className="pill">{l.status.replace("_", " ")}</span>
                    {l.status === "OPEN" && <>
                      <form action={setLeadStatus.bind(null, l.id, "REJECTED")}><button className="text-xs underline">Reject</button></form>
                      <form action={setLeadStatus.bind(null, l.id, "CLOSED")}><button className="text-xs underline">Close</button></form>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

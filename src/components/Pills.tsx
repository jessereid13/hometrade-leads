import type { Urgency } from "@/generated/prisma/client";
import { URGENCY_LABEL } from "@/lib/trades";

export function UrgencyPill({ u }: { u: Urgency }) {
  const cls = u === "NOW" ? "bg-crit text-white" : u === "WEEK" ? "bg-warn text-[#1a1200]" : "";
  return <span className={`pill ${cls}`}>{URGENCY_LABEL[u]}</span>;
}
export function TypePill({ exclusive }: { exclusive: boolean }) {
  return <span className={`pill ${exclusive ? "bg-ink text-white" : ""}`}>{exclusive ? "Exclusive" : "Shared"}</span>;
}

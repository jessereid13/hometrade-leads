import type { Trade, Urgency } from "@/generated/prisma/client";

export const TRADE_LABEL: Record<Trade, string> = {
  HVAC: "HVAC",
  PLUMBING: "Plumbing",
  ROOFING: "Roofing",
  ELECTRICAL: "Electrical",
  CLEANING: "Cleaning",
  LANDSCAPING: "Landscaping",
  PEST: "Pest control",
};
export const TRADES = Object.keys(TRADE_LABEL) as Trade[];

export const URGENCY_LABEL: Record<Urgency, string> = {
  NOW: "Emergency",
  WEEK: "This week",
  FLEX: "Flexible",
};

export const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
export const money0 = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function timeAgo(d: Date) {
  const m = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

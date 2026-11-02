import "server-only";
import type { Trade, Urgency, PricingRule } from "@/generated/prisma/client";
import { db } from "./db";

export const DEFAULT_RULES: Omit<PricingRule, "trade">[] = [];

const DEFAULTS: Record<Trade, { exclusiveCents: number; sharedCents: number; avgTicketCents: number }> = {
  HVAC: { exclusiveCents: 6500, sharedCents: 2800, avgTicketCents: 680000 },
  PLUMBING: { exclusiveCents: 4500, sharedCents: 1800, avgTicketCents: 145000 },
  ROOFING: { exclusiveCents: 8500, sharedCents: 3500, avgTicketCents: 1120000 },
  ELECTRICAL: { exclusiveCents: 4000, sharedCents: 1600, avgTicketCents: 190000 },
  CLEANING: { exclusiveCents: 1800, sharedCents: 800, avgTicketCents: 26000 },
  LANDSCAPING: { exclusiveCents: 2200, sharedCents: 900, avgTicketCents: 230000 },
  PEST: { exclusiveCents: 2500, sharedCents: 1000, avgTicketCents: 42000 },
};

export async function getRule(trade: Trade): Promise<PricingRule> {
  const r = await db.pricingRule.findUnique({ where: { trade } });
  if (r) return r;
  return db.pricingRule.create({ data: { trade, ...DEFAULTS[trade] } });
}

export async function getAllRules(): Promise<PricingRule[]> {
  const trades = Object.keys(DEFAULTS) as Trade[];
  return Promise.all(trades.map(getRule));
}

/** Price a lead from the current rule set. */
export function priceLead(
  rule: PricingRule,
  opts: { exclusive: boolean; urgency: Urgency; estValueCents: number },
) {
  let cents = opts.exclusive ? rule.exclusiveCents : rule.sharedCents;
  if (opts.urgency === "NOW") cents = Math.round(cents * rule.emergencyMult);
  if (opts.estValueCents >= rule.bigJobThresholdCents) cents = Math.round(cents * rule.bigJobMult);
  return Math.round(cents / 100) * 100; // whole dollars
}

import "server-only";
import { Prisma, type Trade, type Urgency } from "@/generated/prisma/client";
import { db } from "./db";
import { getRule, priceLead } from "./pricing";
import { notifyNewLead } from "./notify";

export class BuyError extends Error {}

export type NewLeadInput = {
  trade: Trade;
  title: string;
  description: string;
  urgency: Urgency;
  homeownerName: string;
  phone: string;
  email?: string;
  address?: string;
  zip: string;
  estValueCents?: number;
  exclusive?: boolean;
  source?: string;
  utmSource?: string;
  utmCampaign?: string;
};

/** Create a lead, price it, and alert matching pros. */
export async function createLead(input: NewLeadInput) {
  const rule = await getRule(input.trade);
  const estValueCents = input.estValueCents ?? rule.avgTicketCents;
  // Default policy: emergencies and big jobs sell exclusive; the rest shared.
  const exclusive = input.exclusive ?? (input.urgency === "NOW" || estValueCents >= rule.bigJobThresholdCents);
  const priceCents = priceLead(rule, { exclusive, urgency: input.urgency, estValueCents });

  const lead = await db.lead.create({
    data: {
      trade: input.trade,
      title: input.title,
      description: input.description,
      urgency: input.urgency,
      homeownerName: input.homeownerName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      zip: input.zip,
      estValueCents,
      exclusive,
      priceCents,
      maxSlots: exclusive ? 1 : rule.sharedSlots,
      source: input.source ?? "web",
      utmSource: input.utmSource,
      utmCampaign: input.utmCampaign,
    },
  });

  // Fire-and-forget email alerts to pros whose trades + ZIPs match.
  notifyNewLead(lead).catch((e) => console.error("notify failed", e));
  return lead;
}

/**
 * Atomically buy a lead: checks balance and remaining slots in one
 * transaction so two pros can't oversell an exclusive lead.
 */
export async function buyLead(companyId: string, leadId: string) {
  // Serializable isolation can abort the losing side of a race (P2034);
  // retry once so the caller gets a clear "sold out" instead of a DB error.
  for (let attempt = 0; ; attempt++) {
    try {
      return await buyLeadOnce(companyId, leadId);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "P2034" && attempt < 2) continue;
      throw e;
    }
  }
}

async function buyLeadOnce(companyId: string, leadId: string) {
  return db.$transaction(
    async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: leadId } });
      if (!lead || lead.status !== "OPEN") throw new BuyError("This lead is no longer available.");

      const already = await tx.purchase.findUnique({ where: { leadId_companyId: { leadId, companyId } } });
      if (already) throw new BuyError("You already own this lead.");

      // Conditional updates: both must affect exactly one row.
      const slot = await tx.lead.updateMany({
        where: { id: leadId, status: "OPEN", soldCount: { lt: lead.maxSlots } },
        data: { soldCount: { increment: 1 } },
      });
      if (slot.count !== 1) throw new BuyError("Someone just bought the last spot on this lead.");

      const paid = await tx.company.updateMany({
        where: { id: companyId, balanceCents: { gte: lead.priceCents } },
        data: { balanceCents: { decrement: lead.priceCents } },
      });
      if (paid.count !== 1) throw new BuyError("Your balance is too low for this lead. Add funds first.");

      const purchase = await tx.purchase.create({
        data: { leadId, companyId, priceCents: lead.priceCents },
      });
      await tx.transaction.create({
        data: { companyId, amountCents: -lead.priceCents, type: "PURCHASE", reference: purchase.id },
      });
      if (lead.soldCount + 1 >= lead.maxSlots) {
        await tx.lead.update({ where: { id: leadId }, data: { status: "SOLD_OUT" } });
      }
      return purchase;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Approve a refund: credit the company and mark the request. */
export async function approveRefund(refundId: string) {
  return db.$transaction(async (tx) => {
    const r = await tx.refundRequest.findUnique({ where: { id: refundId }, include: { purchase: true } });
    if (!r || r.status !== "PENDING") throw new Error("Refund not pending");
    await tx.company.update({
      where: { id: r.purchase.companyId },
      data: { balanceCents: { increment: r.purchase.priceCents } },
    });
    await tx.transaction.create({
      data: { companyId: r.purchase.companyId, amountCents: r.purchase.priceCents, type: "REFUND", reference: r.purchaseId },
    });
    await tx.refundRequest.update({ where: { id: refundId }, data: { status: "APPROVED", resolvedAt: new Date() } });
  });
}

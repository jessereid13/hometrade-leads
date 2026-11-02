"use server";
import { revalidatePath } from "next/cache";
import type { LeadStatus, Trade } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { approveRefund } from "@/lib/leads";
import { TRADES } from "@/lib/trades";

export async function savePricing(form: FormData) {
  await requireAdmin();
  for (const trade of TRADES) {
    const n = (k: string) => Number(form.get(`${trade}.${k}`));
    await db.pricingRule.update({
      where: { trade: trade as Trade },
      data: {
        exclusiveCents: Math.round(n("ex") * 100),
        sharedCents: Math.round(n("sh") * 100),
        sharedSlots: Math.max(1, Math.round(n("slots"))),
        emergencyMult: n("emerg"),
        bigJobMult: n("big"),
        bigJobThresholdCents: Math.round(n("thresh") * 100),
      },
    });
  }
  revalidatePath("/admin/pricing");
  revalidatePath("/");
}

export async function resolveRefund(id: string, approve: boolean) {
  await requireAdmin();
  if (approve) await approveRefund(id);
  else await db.refundRequest.update({ where: { id }, data: { status: "DENIED", resolvedAt: new Date() } });
  revalidatePath("/admin/refunds");
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  await requireAdmin();
  await db.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
}

export async function adjustBalance(companyId: string, amountCents: number, note: string) {
  await requireAdmin();
  await db.$transaction([
    db.company.update({ where: { id: companyId }, data: { balanceCents: { increment: amountCents } } }),
    db.transaction.create({ data: { companyId, amountCents, type: "ADJUSTMENT", reference: note.slice(0, 120) } }),
  ]);
  revalidatePath("/admin/buyers");
}

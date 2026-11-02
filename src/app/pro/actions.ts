"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PurchaseStatus, Trade } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser, requireCompany } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation";
import { buyLead, BuyError } from "@/lib/leads";
import { stripe, TOPUP_TIERS } from "@/lib/stripe";

export type ActionState = { error?: string; ok?: boolean };

export async function saveOnboarding(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone"),
    trades: form.getAll("trades"),
    serviceZips: String(form.get("serviceZips") ?? "").split(/[\s,]+/).filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.company.upsert({
    where: { ownerId: user.id },
    update: { name: d.name, phone: d.phone || null, trades: d.trades as Trade[], serviceZips: [...new Set(d.serviceZips)] },
    create: { ownerId: user.id, name: d.name, phone: d.phone || null, trades: d.trades as Trade[], serviceZips: [...new Set(d.serviceZips)] },
  });
  revalidatePath("/pro");
  redirect(user.company ? "/pro" : "/pro/billing?welcome=1");
}

export async function purchaseLead(leadId: string): Promise<ActionState> {
  const { company } = await requireCompany();
  try {
    await buyLead(company.id, leadId);
  } catch (e) {
    if (e instanceof BuyError) return { error: e.message };
    console.error(e);
    return { error: "Something went wrong. You were not charged." };
  }
  revalidatePath("/pro");
  redirect("/pro/my-leads?bought=1");
}

export async function updatePurchaseStatus(purchaseId: string, status: PurchaseStatus) {
  const { company } = await requireCompany();
  await db.purchase.updateMany({ where: { id: purchaseId, companyId: company.id }, data: { status } });
  revalidatePath("/pro/my-leads");
}

export async function requestRefund(purchaseId: string, reason: string): Promise<ActionState> {
  const { company } = await requireCompany();
  const p = await db.purchase.findFirst({ where: { id: purchaseId, companyId: company.id }, include: { refund: true } });
  if (!p) return { error: "Purchase not found." };
  if (p.refund) return { error: "A refund was already requested for this lead." };
  if (Date.now() - p.createdAt.getTime() > 72 * 36e5) return { error: "Refunds must be requested within 72 hours." };
  await db.refundRequest.create({ data: { purchaseId, reason: reason.slice(0, 500) || "No reason given" } });
  revalidatePath("/pro/my-leads");
  return { ok: true };
}

export async function startTopup(form: FormData) {
  const { user, company } = await requireCompany();
  const tier = TOPUP_TIERS[Number(form.get("tier"))];
  if (!tier) return;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  let customerId = company.stripeCustomerId;
  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email, name: company.name, metadata: { companyId: company.id } });
    customerId = c.id;
    await db.company.update({ where: { id: company.id }, data: { stripeCustomerId: c.id } });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: tier.amountCents,
        product_data: { name: `Lead credit ${tier.amountCents / 100 >> 0}${tier.bonusCents ? ` (+$${tier.bonusCents / 100} bonus)` : ""}` },
      },
    }],
    metadata: { companyId: company.id, creditCents: String(tier.amountCents + tier.bonusCents) },
    success_url: `${appUrl}/pro/billing?success=1`,
    cancel_url: `${appUrl}/pro/billing?canceled=1`,
  });
  redirect(session.url!);
}

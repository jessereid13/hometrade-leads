import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Bad signature: ${(e as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const companyId = s.metadata?.companyId;
    const credit = Number(s.metadata?.creditCents ?? 0);
    if (companyId && credit > 0 && s.payment_status === "paid") {
      // Idempotent: stripeSessionId is unique, so a replayed event is a no-op.
      try {
        await db.$transaction([
          db.transaction.create({ data: { companyId, amountCents: credit, type: "TOPUP", stripeSessionId: s.id, reference: s.payment_intent as string } }),
          db.company.update({ where: { id: companyId }, data: { balanceCents: { increment: credit } } }),
        ]);
      } catch (e) {
        if ((e as { code?: string }).code !== "P2002") throw e; // P2002 = already processed
      }
    }
  }
  return NextResponse.json({ received: true });
}

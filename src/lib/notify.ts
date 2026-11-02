import "server-only";
import type { Lead } from "@/generated/prisma/client";
import { db } from "./db";
import { TRADE_LABEL, URGENCY_LABEL, money } from "./trades";

/**
 * Email every pro whose trades include this lead's trade and whose
 * service ZIPs include the lead's ZIP. Uses Resend if configured,
 * otherwise logs to the server console.
 */
export async function notifyNewLead(lead: Lead) {
  const companies = await db.company.findMany({
    where: { trades: { has: lead.trade }, serviceZips: { has: lead.zip }, notifyEmail: true },
    include: { owner: { select: { email: true } } },
  });
  if (!companies.length) return;

  const url = `${process.env.APP_URL ?? ""}/pro/leads/${lead.id}`;
  const subject = `New ${TRADE_LABEL[lead.trade]} lead in ${lead.zip} · ${money(lead.priceCents)}`;
  const text = `${lead.title}\n${URGENCY_LABEL[lead.urgency]} · ZIP ${lead.zip} · ${lead.exclusive ? "Exclusive" : "Shared"}\n\n${lead.description}\n\nBuy it: ${url}`;

  await Promise.all(companies.map((c) => sendEmail(c.owner.email, subject, text)));
}

export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email → ${to}] ${subject}\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) console.error("Resend error", await res.text());
}

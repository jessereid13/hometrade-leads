import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/validation";
import { createLead } from "@/lib/leads";

/**
 * Public intake API for external forms, call-tracking tools and Zapier.
 * POST /api/leads  with header  x-api-key: $LEAD_API_KEY
 * Body: JSON matching the quote form fields, plus optional
 * estValueCents, exclusive, source, phoneVerified.
 */
export async function POST(req: Request) {
  const key = process.env.LEAD_API_KEY;
  if (!key || req.headers.get("x-api-key") !== key) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = quoteSchema.extend({}).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  const lead = await createLead({
    ...d,
    email: d.email || undefined,
    address: d.address || undefined,
    estValueCents: typeof body.estValueCents === "number" ? body.estValueCents : undefined,
    exclusive: typeof body.exclusive === "boolean" ? body.exclusive : undefined,
    source: typeof body.source === "string" ? body.source.slice(0, 40) : "api",
  });
  return NextResponse.json({ id: lead.id, priceCents: lead.priceCents, exclusive: lead.exclusive }, { status: 201 });
}

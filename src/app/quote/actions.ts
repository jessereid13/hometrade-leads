"use server";
import { redirect } from "next/navigation";
import { quoteSchema } from "@/lib/validation";
import { createLead } from "@/lib/leads";

export type QuoteState = { errors?: Record<string, string[]>; message?: string };

export async function submitQuote(_: QuoteState, form: FormData): Promise<QuoteState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  await createLead({
    ...d,
    email: d.email || undefined,
    address: d.address || undefined,
    source: "web",
  });
  redirect("/quote?sent=1");
}

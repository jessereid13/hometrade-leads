import "dotenv/config";
import { PrismaClient, type Trade, type Urgency } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const RULES: Record<Trade, [number, number, number]> = {
  HVAC: [6500, 2800, 680000],
  PLUMBING: [4500, 1800, 145000],
  ROOFING: [8500, 3500, 1120000],
  ELECTRICAL: [4000, 1600, 190000],
  CLEANING: [1800, 800, 26000],
  LANDSCAPING: [2200, 900, 230000],
  PEST: [2500, 1000, 42000],
};

const SAMPLE: [Trade, string, string, Urgency, string][] = [
  ["HVAC", "AC not cooling, 14-yr-old unit", "Unit runs but house stays at 80°. Wants repair and replacement quotes.", "NOW", "80202"],
  ["PLUMBING", "Water heater leaking from base", "50-gal gas tank, 11 years old. Water on the floor now.", "NOW", "80210"],
  ["ROOFING", "Hail damage, insurance claim open", "Adjuster coming Thursday. Wants a contractor on site for the inspection.", "WEEK", "80221"],
  ["ELECTRICAL", "Level 2 EV charger install", "Garage is 40 ft from the panel. NEMA 14-50 or hardwired.", "FLEX", "80231"],
  ["CLEANING", "Move-out deep clean, 3BR", "Lease ends Sunday. Needs carpet shampoo too.", "WEEK", "80014"],
  ["LANDSCAPING", "Paver patio, 16×20", "Has a design sketch. Wants install before Thanksgiving.", "WEEK", "80126"],
  ["PEST", "Mice in the kitchen", "Droppings behind the stove, two seen this week.", "NOW", "80003"],
];

async function main() {
  for (const [trade, [exclusiveCents, sharedCents, avgTicketCents]] of Object.entries(RULES) as [Trade, [number, number, number]][]) {
    await db.pricingRule.upsert({
      where: { trade },
      update: {},
      create: { trade, exclusiveCents, sharedCents, avgTicketCents },
    });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, passwordHash: await bcrypt.hash(password, 11), role: "ADMIN" },
  });

  if (process.env.SEED_SAMPLE_LEADS !== "false" && (await db.lead.count()) === 0) {
    for (const [trade, title, description, urgency, zip] of SAMPLE) {
      const r = RULES[trade];
      const exclusive = urgency === "NOW";
      let price = exclusive ? r[0] : r[1];
      if (urgency === "NOW") price = Math.round(price * 1.6);
      await db.lead.create({
        data: {
          trade, title, description, urgency, zip, exclusive,
          homeownerName: "Sample Homeowner", phone: "(555) 010-0100",
          estValueCents: r[2], priceCents: Math.round(price / 100) * 100,
          maxSlots: exclusive ? 1 : 3, source: "seed",
        },
      });
    }
  }
  console.log(`Seeded pricing rules and admin ${email}`);
}

main().finally(() => db.$disconnect());

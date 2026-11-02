import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");

export const TOPUP_TIERS = [
  { amountCents: 10000, bonusCents: 0 },
  { amountCents: 25000, bonusCents: 2500 },
  { amountCents: 50000, bonusCents: 7500 },
];

import { z } from "zod";

export const zip = z.string().regex(/^\d{5}$/, "Enter a 5-digit ZIP");
export const phone = z.string().min(10, "Enter a phone number").max(20);

export const quoteSchema = z.object({
  trade: z.enum(["HVAC", "PLUMBING", "ROOFING", "ELECTRICAL", "CLEANING", "LANDSCAPING", "PEST"]),
  urgency: z.enum(["NOW", "WEEK", "FLEX"]),
  title: z.string().min(4, "Describe the job in a few words").max(120),
  description: z.string().min(10, "Add a little more detail").max(2000),
  homeownerName: z.string().min(2).max(80),
  phone,
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  zip,
  utmSource: z.string().max(80).optional(),
  utmCampaign: z.string().max(80).optional(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});

export const onboardingSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phone.optional().or(z.literal("")),
  trades: z.array(z.enum(["HVAC", "PLUMBING", "ROOFING", "ELECTRICAL", "CLEANING", "LANDSCAPING", "PEST"])).min(1, "Pick at least one trade"),
  serviceZips: z.array(zip).min(1, "Add at least one ZIP"),
});

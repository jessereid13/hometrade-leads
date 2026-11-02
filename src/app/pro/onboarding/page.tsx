import { requireUser } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function Onboarding() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <div className="eyebrow">{user.company ? "Account settings" : "Step 1 of 2"}</div>
      <h1 className="mt-1 text-4xl font-extrabold">{user.company ? "Your service area" : "Tell us about your company"}</h1>
      <p className="mt-2 text-[#5a6675]">Leads outside your trades and ZIPs never show up in your feed.</p>
      <OnboardingForm company={user.company} />
    </div>
  );
}

import QuoteForm from "./QuoteForm";

export default async function QuotePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (sp.sent) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-4xl font-extrabold">Got it.</h1>
        <p className="mt-3 text-[#5a6675]">Local pros are being notified now. Expect a call shortly. If it&apos;s an emergency and you don&apos;t hear back within 15 minutes, call the number on your confirmation email.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <div className="eyebrow">Free quotes from local pros</div>
        <h1 className="mt-1 text-4xl font-extrabold">Tell us about the job</h1>
        <p className="mt-2 text-[#5a6675]">Takes a minute. Up to three licensed pros in your area will call you.</p>
      </div>
      <QuoteForm utmSource={sp.utm_source} utmCampaign={sp.utm_campaign} />
    </div>
  );
}

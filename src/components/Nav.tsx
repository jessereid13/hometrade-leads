import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/trades";

export default async function Nav() {
  const s = await getSession();
  const company = s ? await db.company.findUnique({ where: { ownerId: s.userId }, select: { balanceCents: true } }) : null;
  return (
    <header className="sticky top-0 z-20 bg-ink text-white">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold uppercase tracking-wide">
          <span className="inline-block h-3.5 w-3.5 -skew-x-12 bg-accent" />
          Hometrade Leads
        </Link>
        <nav className="ml-auto flex flex-wrap gap-1 text-sm font-semibold">
          {s ? (
            <>
              <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/pro">Lead feed</Link>
              <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/pro/my-leads">My leads</Link>
              <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/pro/billing">Billing</Link>
              {s.role === "ADMIN" && <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/admin">Admin</Link>}
              <Link className="rounded px-2.5 py-1.5 opacity-70 hover:bg-white/10" href="/logout">Log out</Link>
            </>
          ) : (
            <>
              <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/quote">Get a quote</Link>
              <Link className="rounded px-2.5 py-1.5 hover:bg-white/10" href="/login">Pro log in</Link>
              <Link className="rounded bg-accent px-2.5 py-1.5 text-[#1a1200]" href="/signup">Join as a pro</Link>
            </>
          )}
        </nav>
        {company && (
          <div className="rounded bg-white/10 px-2.5 py-1 text-xs">
            Balance <b className="num text-accent">{money(company.balanceCents)}</b>
          </div>
        )}
      </div>
    </header>
  );
}

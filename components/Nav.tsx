import Link from "next/link";

const links = [
  { href: "/journal", label: "Journal" },
  { href: "/insights", label: "Insights" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/admin/events", label: "Events" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-1 py-3">
        <Link href="/journal" className="font-semibold tracking-tight">
          <span className="rounded-lg bg-zinc-900 px-2 py-1 text-white">J</span>{" "}
          Your Journal Companion
        </Link>

        <nav className="flex gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

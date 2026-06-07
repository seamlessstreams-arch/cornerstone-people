import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { NavLink } from "./ui";

export function AppShell({
  links,
  email,
  children,
}: {
  links: { href: string; label: string }[];
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-6 py-3">
          <Link
            href="/"
            className="mr-2 text-base font-semibold tracking-tight text-brand-700"
          >
            Cornerstone People
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-stone-400 sm:inline">
              {email}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-secondary px-3 py-1.5">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

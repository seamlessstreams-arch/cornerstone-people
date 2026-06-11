import { AppShell } from "@/components/AppShell";
import { requireEmployer, isAdminEmail } from "@/lib/auth";

const links = [
  { href: "/employer", label: "Dashboard" },
  { href: "/employer/profile", label: "Company profile" },
  { href: "/employer/positions", label: "Positions" },
  { href: "/employer/browse", label: "Browse candidates" },
  { href: "/employer/market", label: "Market" },
  { href: "/employer/matches", label: "Matches" },
  { href: "/employer/safer-recruitment", label: "Safer recruitment" },
  { href: "/employer/reference-bank", label: "Reference bank" },
];

// Admin-only links — hidden from ordinary users.
const adminLinks = [
  { href: "/employer/talent-pipeline", label: "Sourcing (admin)" },
];

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireEmployer();
  const navLinks = isAdminEmail(user.email) ? [...links, ...adminLinks] : links;
  return (
    <AppShell links={navLinks} email={user.email}>
      {children}
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { requireEmployer } from "@/lib/auth";

const links = [
  { href: "/employer", label: "Dashboard" },
  { href: "/employer/profile", label: "Company profile" },
  { href: "/employer/positions", label: "Positions" },
  { href: "/employer/browse", label: "Browse candidates" },
  { href: "/employer/market", label: "Market" },
  { href: "/employer/matches", label: "Matches" },
  { href: "/employer/talent-pipeline", label: "Talent pipeline" },
  { href: "/employer/safer-recruitment", label: "Safer recruitment" },
  { href: "/employer/reference-bank", label: "Reference bank" },
];

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireEmployer();
  return (
    <AppShell links={links} email={user.email}>
      {children}
    </AppShell>
  );
}

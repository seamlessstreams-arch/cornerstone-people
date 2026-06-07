import { AppShell } from "@/components/AppShell";
import { requireCandidate } from "@/lib/auth";

const links = [
  { href: "/candidate", label: "Dashboard" },
  { href: "/candidate/profile", label: "My profile" },
  { href: "/candidate/references", label: "References" },
  { href: "/candidate/browse", label: "Browse homes" },
  { href: "/candidate/blocks", label: "Block-list" },
  { href: "/candidate/matches", label: "Matches" },
];

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireCandidate();
  return (
    <AppShell links={links} email={user.email}>
      {children}
    </AppShell>
  );
}

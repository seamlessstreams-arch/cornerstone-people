import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getCurrentUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a logged-in candidate and return their Candidate row. */
export async function requireCandidate() {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") redirect("/employer");
  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.id },
  });
  if (!candidate) redirect("/login");
  return { user, candidate };
}

/** Require a logged-in employer and return their Employer row. */
export async function requireEmployer() {
  const user = await requireUser();
  if (user.role !== "EMPLOYER") redirect("/candidate");
  const employer = await prisma.employer.findUnique({
    where: { userId: user.id },
  });
  if (!employer) redirect("/login");
  return { user, employer };
}

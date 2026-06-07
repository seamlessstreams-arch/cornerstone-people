import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./constants";

const COOKIE_NAME = "cornerstone_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  cookies().set(COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (id) {
    await prisma.session.deleteMany({ where: { id } });
  }
  cookies().delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

/** Returns the logged-in user, or null. Clears expired/invalid sessions. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as Role,
  };
}

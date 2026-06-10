import "server-only";
import { prisma } from "./db";
import type { SessionUser } from "./session";

// Append-only audit logging (principle 9: every important action recorded).
// Deliberately swallows its own errors — a failed audit write must never block
// or crash the action it is recording, but we still surface it in dev.

export async function logAudit(args: {
  actor?: SessionUser | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: args.actor?.id ?? null,
        actorEmail: args.actor?.email ?? null,
        actorRole: args.actor?.role ?? null,
        action: args.action,
        entityType: args.entityType ?? null,
        entityId: args.entityId ?? null,
        summary: args.summary ?? null,
        meta: args.meta ? JSON.stringify(args.meta) : null,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("audit log failed", err);
    }
  }
}

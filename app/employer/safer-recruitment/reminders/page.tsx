import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { dueReminders } from "@/lib/safer-recruitment-data";
import { PageHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const SEV: Record<string, { label: string; cls: string }> = {
  OVERDUE: { label: "Overdue", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  DUE: { label: "Due", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  ACTION: { label: "Action", cls: "bg-stone-100 text-stone-600 ring-stone-200" },
};

export default async function RemindersPage() {
  const { employer } = await requireEmployer();
  const reminders = await dueReminders(employer.id);

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="What's due now across your active cases — overdue chasers, exceptional-start reviews and anything awaiting a manager. The system tracks the dates; you make the call."
        action={
          <Link href="/employer/safer-recruitment" className="btn-secondary">
            ← Dashboard
          </Link>
        }
      />

      {reminders.length === 0 ? (
        <EmptyState title="Nothing due">
          No overdue chasers or outstanding actions right now.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <ul className="divide-y divide-stone-100">
            {reminders.map((r, i) => {
              const s = SEV[r.severity];
              return (
                <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex flex-none items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>
                      {s.label}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/employer/safer-recruitment/${r.caseId}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {r.name}
                      </Link>
                      <div className="truncate text-sm text-stone-600">{r.message}</div>
                    </div>
                  </div>
                  <Link
                    href={`/employer/safer-recruitment/${r.caseId}`}
                    className="btn-secondary flex-none px-3 py-1.5 text-xs"
                  >
                    Open case
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

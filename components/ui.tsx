import Link from "next/link";
import type { ReactNode } from "react";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 ${className}`}
      title="References pre-verified by Cornerstone"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
          clipRule="evenodd"
        />
      </svg>
      Verified references
    </span>
  );
}

export function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-stone-800">{value || "—"}</dd>
    </div>
  );
}

export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-stone-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="chip">
          {t}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
          {children}
        </p>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-stone-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Select({
  name,
  defaultValue,
  options,
  placeholder = "Select…",
  required,
}: {
  name: string;
  defaultValue?: string | null;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className="input"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
    >
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Safer Recruitment OS components
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
  hint?: string;
}) {
  const ring =
    tone === "danger"
      ? "ring-rose-200"
      : tone === "warn"
      ? "ring-amber-200"
      : tone === "good"
      ? "ring-emerald-200"
      : "ring-stone-200";
  const val =
    tone === "danger"
      ? "text-rose-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "good"
      ? "text-emerald-700"
      : "text-stone-900";
  return (
    <div className={`rounded-xl bg-white p-4 ring-1 ${ring}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${val}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-stone-400">{hint}</div> : null}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  // greens
  STRONG: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ADEQUATE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLEARED_TO_START: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  RECEIVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  // ambers
  BASIC: "bg-amber-50 text-amber-700 ring-amber-200",
  INCOMPLETE: "bg-amber-50 text-amber-700 ring-amber-200",
  NEEDS_EXPLANATION: "bg-amber-50 text-amber-700 ring-amber-200",
  REFERENCE_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  DBS_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  EMPLOYMENT_GAP_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  CHASED: "bg-amber-50 text-amber-700 ring-amber-200",
  MORE_INFORMATION_REQUIRED: "bg-amber-50 text-amber-700 ring-amber-200",
  EXCEPTIONAL_SUPERVISED_START: "bg-amber-50 text-amber-700 ring-amber-200",
  // reds
  CONCERNING: "bg-rose-50 text-rose-700 ring-rose-200",
  CONTRADICTORY: "bg-rose-50 text-rose-700 ring-rose-200",
  CONCERN: "bg-rose-50 text-rose-700 ring-rose-200",
  ESCALATED: "bg-rose-50 text-rose-700 ring-rose-200",
  REQUIRES_HUMAN_REVIEW: "bg-rose-50 text-rose-700 ring-rose-200",
  RM_REVIEW_REQUIRED: "bg-rose-50 text-rose-700 ring-rose-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  INSUFFICIENT: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONES[status] ?? "bg-stone-100 text-stone-600 ring-stone-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {label ?? status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  const tone =
    level === "high"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : level === "moderate"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {level} risk
    </span>
  );
}

// Banner shown wherever AI/rule-based output is presented, to make the
// human-sign-off principle visible in the UI (principles 2–4).
export function HumanReviewRequiredBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-none">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>
        {children ??
          "AI-supported draft / recommendation. A named human must make the final decision — the system will not decide for you."}
      </span>
    </div>
  );
}

export function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
      {children}
    </span>
  );
}

"use client";

import { useState } from "react";
import { checkEmploymentGaps, type WorkPeriod } from "@/lib/safer-recruitment";
import { EMPLOYMENT_GAP_STATUS } from "@/lib/constants";
import { saveGapReview } from "@/app/actions/safer-recruitment";

type Row = WorkPeriod & { id: number };

const KINDS: WorkPeriod["kind"][] = [
  "employment",
  "agency",
  "self-employed",
  "education",
  "other",
];

export function GapChecker({
  caseId,
  initialFindings,
  initialStatus,
  initialNotes,
  employmentHistory,
}: {
  caseId: string;
  initialFindings: string | null;
  initialStatus: string;
  initialNotes: string | null;
  employmentHistory: string | null;
}) {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, label: "", start: "", end: null, kind: "employment", reasonForLeaving: "" },
  ]);
  const [run, setRun] = useState<ReturnType<typeof checkEmploymentGaps> | null>(
    null
  );

  function update(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows((rs) => [
      ...rs,
      { id: Math.max(0, ...rs.map((r) => r.id)) + 1, label: "", start: "", end: null, kind: "employment", reasonForLeaving: "" },
    ]);
  }

  function analyse() {
    const periods = rows.filter((r) => r.label && r.start);
    setRun(checkEmploymentGaps(periods, { now: new Date().toISOString().slice(0, 7) }));
  }

  return (
    <div className="space-y-4">
      {employmentHistory ? (
        <div className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Candidate's stated history
          </div>
          <p className="whitespace-pre-wrap">{employmentHistory}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2">
            <input
              className="input col-span-4"
              placeholder="Role / employer"
              value={r.label}
              onChange={(e) => update(r.id, { label: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="YYYY-MM"
              value={r.start}
              onChange={(e) => update(r.id, { start: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="YYYY-MM / now"
              value={r.end ?? ""}
              onChange={(e) => update(r.id, { end: e.target.value || null })}
            />
            <select
              className="input col-span-2"
              value={r.kind}
              onChange={(e) => update(r.id, { kind: e.target.value as WorkPeriod["kind"] })}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              className="input col-span-2"
              placeholder="Reason left"
              value={r.reasonForLeaving ?? ""}
              onChange={(e) => update(r.id, { reasonForLeaving: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={add} className="btn-secondary px-3 py-1.5 text-sm">
          + Add period
        </button>
        <button type="button" onClick={analyse} className="btn-primary px-3 py-1.5 text-sm">
          Run gap check
        </button>
      </div>

      {run ? (
        <div className="rounded-lg border border-stone-200 p-3">
          <div className="text-sm font-medium text-stone-800">
            {run.findings.length === 0
              ? "No gaps, overlaps or short roles detected."
              : `${run.findings.length} finding(s) — ${run.totalGapMonths} month(s) of gaps total.`}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {run.findings.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-xs text-stone-400">{f.type}</span>
                {f.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={saveGapReview} className="space-y-2 border-t border-stone-100 pt-3">
        <input type="hidden" name="caseId" value={caseId} />
        <input
          type="hidden"
          name="findings"
          value={run ? JSON.stringify(run.findings) : initialFindings ?? ""}
        />
        <label className="block text-xs font-medium uppercase tracking-wide text-stone-400">
          Manager review decision
        </label>
        <select name="status" defaultValue={initialStatus} className="input">
          {EMPLOYMENT_GAP_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
        <textarea
          name="managerNotes"
          defaultValue={initialNotes ?? ""}
          rows={3}
          placeholder="Manager review notes — what was checked and accepted/escalated."
          className="input"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-sm">
          Save review
        </button>
      </form>
    </div>
  );
}

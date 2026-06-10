"use client";

import { useState } from "react";

export type DocItem = {
  id: string;
  originalName: string;
  kind: string | null;
  createdAt: string;
};

// Lists stored documents. Downloads are fetched on click as short-lived signed
// URLs via a server action — the URL is never embedded in the page.
export function DocumentList({
  documents,
  fetchUrl,
  onDelete,
}: {
  documents: DocItem[];
  fetchUrl: (id: string) => Promise<string | null>;
  onDelete?: (formData: FormData) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  if (documents.length === 0) {
    return <p className="text-sm text-stone-400">No documents uploaded yet.</p>;
  }

  async function open(id: string) {
    setBusy(id);
    try {
      const url = await fetchUrl(id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="min-w-0">
            <span className="truncate font-medium text-stone-800">{d.originalName}</span>
            {d.kind ? (
              <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                {d.kind}
              </span>
            ) : null}
          </span>
          <span className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={() => open(d.id)}
              disabled={busy === d.id}
              className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
            >
              {busy === d.id ? "Opening…" : "Download"}
            </button>
            {onDelete ? (
              <form action={onDelete}>
                <input type="hidden" name="fileId" value={d.id} />
                <button type="submit" className="text-xs font-medium text-rose-600 hover:underline">
                  Delete
                </button>
              </form>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

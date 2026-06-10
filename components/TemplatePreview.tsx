"use client";

import { useMemo, useState } from "react";
import {
  buildTemplate,
  TEMPLATE_LABELS,
  type TemplateKind,
  type TemplateContext,
} from "@/lib/reference-templates";
import { CopyButton } from "./CopyButton";

// Lets an employer preview and copy any of the professional reference templates.
// No email integration required — "copy email text" always works.
export function TemplatePreview({ ctx }: { ctx: TemplateContext }) {
  const [kind, setKind] = useState<TemplateKind>("childrens_workforce");
  const tpl = useMemo(() => buildTemplate(kind, ctx), [kind, ctx]);

  return (
    <div className="space-y-3">
      <select
        className="input"
        value={kind}
        onChange={(e) => setKind(e.target.value as TemplateKind)}
      >
        {(Object.keys(TEMPLATE_LABELS) as TemplateKind[]).map((k) => (
          <option key={k} value={k}>
            {TEMPLATE_LABELS[k]}
          </option>
        ))}
      </select>
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
        <div className="text-xs font-semibold text-stone-500">Subject</div>
        <div className="mb-2 text-sm text-stone-800">{tpl.subject}</div>
        <div className="text-xs font-semibold text-stone-500">Body</div>
        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-stone-700">
          {tpl.body}
        </pre>
      </div>
      <div className="flex gap-2">
        <CopyButton text={`Subject: ${tpl.subject}\n\n${tpl.body}`} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vacancyPack } from "@/lib/vacancy";
import { PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function VacancyPackPage({
  params,
}: {
  params: { id: string };
}) {
  const { employer } = await requireEmployer();
  const position = await prisma.position.findFirst({
    where: { id: params.id, employerId: employer.id },
  });
  if (!position) notFound();

  const pack = vacancyPack({
    title: position.title,
    region: position.region,
    shiftPattern: position.shiftPattern,
    companyName: employer.companyName,
    ethos: employer.ethos,
    childrenSupported: employer.childrenSupported,
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Vacancy pack"
        subtitle={`${position.title} — a safeguarding-aware advert, job description, person specification and safer-recruitment checklist. Review and adapt before use.`}
        action={
          <div className="flex gap-2">
            <Link href="/employer/positions" className="btn-secondary">
              ← Positions
            </Link>
            <PrintButton label="Print pack" />
          </div>
        }
      />

      <section className="card mb-5">
        <h2 className="font-semibold text-stone-900">Advert</h2>
        <div className="mt-2 whitespace-pre-line text-sm text-stone-700">{pack.advert}</div>
      </section>

      <section className="card mb-5">
        <h2 className="font-semibold text-stone-900">Job description</h2>
        <p className="mt-2 text-sm text-stone-700">{pack.jobDescription.summary}</p>
        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Key responsibilities
        </h3>
        <ul className="mt-1 space-y-1 text-sm text-stone-700">
          {pack.jobDescription.responsibilities.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-brand-600">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mb-5">
        <h2 className="font-semibold text-stone-900">Person specification</h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Essential</h3>
            <ul className="mt-1 space-y-1 text-sm text-stone-700">
              {pack.personSpec.essential.map((e) => (
                <li key={e} className="flex gap-2"><span className="text-brand-600">•</span><span>{e}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Desirable</h3>
            <ul className="mt-1 space-y-1 text-sm text-stone-700">
              {pack.personSpec.desirable.map((d) => (
                <li key={d} className="flex gap-2"><span className="text-brand-600">•</span><span>{d}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-stone-900">Safer-recruitment checklist</h2>
        <ul className="mt-2 space-y-1 text-sm text-stone-700">
          {pack.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-3.5 w-3.5 flex-none rounded-sm border border-stone-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

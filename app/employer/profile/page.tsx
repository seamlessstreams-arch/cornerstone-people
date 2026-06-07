import { requireEmployer } from "@/lib/auth";
import { updateEmployerProfile } from "@/app/actions/employer";
import { PageHeader, Select } from "@/components/ui";
import { REGIONS, SHIFT_PATTERNS } from "@/lib/constants";

export default async function EmployerProfilePage() {
  const { employer } = await requireEmployer();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Company profile"
        subtitle="This is what candidates see. Sell your home — ethos, the placement picture, what you offer."
      />

      <form action={updateEmployerProfile} className="space-y-6">
        <section className="card grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Home / company name</label>
            <input
              name="companyName"
              defaultValue={employer.companyName}
              required
              className="input"
            />
            <p className="mt-1 text-xs text-stone-400">
              Candidates search this name to block you — keep it your real
              trading name.
            </p>
          </div>
          <div>
            <label className="label">Region</label>
            <Select
              name="region"
              defaultValue={employer.region}
              options={REGIONS}
            />
          </div>
          <div>
            <label className="label">Typical shift pattern</label>
            <Select
              name="shiftPattern"
              defaultValue={employer.shiftPattern}
              options={SHIFT_PATTERNS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Selling points</label>
            <textarea
              name="sellingPoints"
              defaultValue={employer.sellingPoints ?? ""}
              rows={2}
              className="input"
              placeholder="Why people love working here…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Ethos</label>
            <textarea
              name="ethos"
              defaultValue={employer.ethos ?? ""}
              rows={2}
              className="input"
            />
          </div>
          <div>
            <label className="label">Type of children / young people</label>
            <textarea
              name="childrenSupported"
              defaultValue={employer.childrenSupported ?? ""}
              rows={2}
              className="input"
            />
          </div>
          <div>
            <label className="label">Placement picture</label>
            <textarea
              name="placementPicture"
              defaultValue={employer.placementPicture ?? ""}
              rows={2}
              className="input"
            />
          </div>
          <div>
            <label className="label">Support offered</label>
            <textarea
              name="supportOffered"
              defaultValue={employer.supportOffered ?? ""}
              rows={2}
              className="input"
              placeholder="Training, supervision, progression…"
            />
          </div>
          <div>
            <label className="label">Compensation</label>
            <textarea
              name="compensation"
              defaultValue={employer.compensation ?? ""}
              rows={2}
              className="input"
              placeholder="Salary range, sleep-in rates, benefits…"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-6">
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}

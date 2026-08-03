"use client";

type Props = {
  score: number;
  equipmentInMaintenance: number;
  criticalRepairs: number;
  overdueTransfers: number;
};

export default function SundayReadiness({
  score,
  equipmentInMaintenance,
  criticalRepairs,
  overdueTransfers,
}: Props) {
  let scoreColor = "text-green-600";
  let status = "Ready";

  if (score < 95) {
    scoreColor = "text-yellow-600";
    status = "Needs Attention";
  }

  if (score < 85) {
    scoreColor = "text-red-600";
    status = "At Risk";
  }

  return (
    <section className="mb-10 rounded-2xl bg-white p-8 shadow">
      <div className="flex flex-wrap items-center justify-between gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Sunday Readiness
          </p>

          <h2 className={`mt-2 text-6xl font-bold ${scoreColor}`}>
            {score}%
          </h2>

          <p className="mt-2 text-lg font-medium">
            {status}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Equipment in Maintenance
            </p>

            <p className="mt-2 text-3xl font-bold">
              {equipmentInMaintenance}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Critical Repairs
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {criticalRepairs}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Overdue Transfers
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {overdueTransfers}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
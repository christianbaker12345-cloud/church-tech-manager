import Link from "next/link";

type AssetHeaderProps = {
  assetId: string;
  title: string;
  assetTag: string | null;
  status: string | null;
  statusClasses: (status: string | null) => string;
};

export default function AssetHeader({
  assetId,
  title,
  assetTag,
  status,
  statusClasses,
}: AssetHeaderProps) {
  const normalizedStatus =
    status?.trim().toLowerCase() ?? "";

  const isMaintenance =
    normalizedStatus === "maintenance" ||
    normalizedStatus === "in repair";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Individual Asset
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Asset Tag
              </p>

              <p className="mt-1 font-semibold">
                {assetTag || "Not Assigned"}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Type
              </p>

              <p className="mt-1 font-semibold">
                Equipment Asset
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end">
          <p className="mb-2 text-sm uppercase tracking-wide text-slate-300">
            Current Status
          </p>

          {isMaintenance ? (
            <Link
              href={`/assets/${assetId}/maintenance`}
            className="rounded-full border border-rose-500 bg-rose-600 px-5 py-2 text-base font-semibold !text-white shadow-sm transition hover:bg-rose-700 hover:!text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/30"              title="Open maintenance record"
            >
              {status || "Maintenance"}
            </Link>
          ) : (
            <span
              className={`rounded-full px-5 py-2 text-base font-semibold shadow ${statusClasses(
                status
              )}`}
            >
              {status || "Unknown"}
            </span>
          )}

          <p className="mt-4 max-w-xs text-sm text-slate-300">
            This asset is tracked individually and can be
            transferred, maintained, photographed, and managed
            throughout its lifecycle.
          </p>
        </div>
      </div>
    </div>
  );
}
type AssetHeaderProps = {
  title: string;
  assetTag: string | null;
  status: string | null;
  statusClasses: (status: string | null) => string;
};

export default function AssetHeader({
  title,
  assetTag,
  status,
  statusClasses,
}: AssetHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Individual Asset
        </p>

        <h1 className="mt-2 text-4xl font-bold">{title}</h1>

        <p className="mt-2 text-gray-500">
          Asset Tag: {assetTag || "Not assigned"}
        </p>
      </div>

      <span
        className={`rounded-full px-4 py-2 font-semibold ${statusClasses(
          status
        )}`}
      >
        {status || "Unknown"}
      </span>
    </div>
  );
}
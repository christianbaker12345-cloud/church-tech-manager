type ImportSummaryProps = {
  total: number;
  valid: number;
  invalid: number;
  duplicates?: number;
  imported?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
};

export default function ImportSummary({
  total,
  valid,
  invalid,
  duplicates = 0,
  imported,
  updated,
  skipped,
  failed,
}: ImportSummaryProps) {
  const cards = [
    {
      label: "Rows Read",
      value: total,
      valueClassName: "text-slate-950",
    },
    {
      label: "Valid",
      value: valid,
      valueClassName: "text-emerald-700",
    },
    {
      label: "Invalid",
      value: invalid,
      valueClassName: "text-rose-700",
    },
    {
      label: "Duplicates",
      value: duplicates,
      valueClassName: "text-amber-700",
    },
  ];

  if (imported !== undefined) {
    cards.push({
      label: "Imported",
      value: imported,
      valueClassName: "text-blue-700",
    });
  }

  if (updated !== undefined) {
    cards.push({
      label: "Updated",
      value: updated,
      valueClassName: "text-indigo-700",
    });
  }

  if (skipped !== undefined) {
    cards.push({
      label: "Skipped",
      value: skipped,
      valueClassName: "text-slate-700",
    });
  }

  if (failed !== undefined) {
    cards.push({
      label: "Failed",
      value: failed,
      valueClassName: "text-rose-700",
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            {card.label}
          </p>

          <p
            className={`mt-2 text-3xl font-black ${card.valueClassName}`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
type ConditionBadgeProps = {
  condition: string | null | undefined;
  className?: string;
};

function normalizeCondition(condition: string | null | undefined) {
  return condition?.trim().toLowerCase() ?? "";
}

export default function ConditionBadge({
  condition,
  className = "",
}: ConditionBadgeProps) {
  const normalized = normalizeCondition(condition);

  let classes =
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  if (normalized === "new") {
    classes =
      "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  } else if (normalized === "excellent") {
    classes =
      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  } else if (normalized === "good") {
    classes =
      "bg-green-100 text-green-700 ring-1 ring-green-200";
  } else if (normalized === "fair") {
    classes =
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  } else if (normalized === "poor") {
    classes =
      "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
  } else if (
    normalized === "unserviceable" ||
    normalized === "broken"
  ) {
    classes =
      "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes} ${className}`}
    >
      {condition?.trim() || "Unknown"}
    </span>
  );
}
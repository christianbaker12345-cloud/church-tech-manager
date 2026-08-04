type StatusBadgeProps = {
  status: string | null | undefined;
  className?: string;
};

function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() ?? "";
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const normalized = normalizeStatus(status);

  let classes =
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  if (
    normalized === "available" ||
    normalized === "ready" ||
    normalized === "returned" ||
    normalized === "completed"
  ) {
    classes =
      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  } else if (
    normalized === "checked out" ||
    normalized === "active" ||
    normalized === "transferred" ||
    normalized === "reserved"
  ) {
    classes =
      "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  } else if (
    normalized === "maintenance" ||
    normalized === "in progress" ||
    normalized === "waiting" ||
    normalized === "scheduled"
  ) {
    classes =
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  } else if (
    normalized === "in repair" ||
    normalized === "urgent" ||
    normalized === "critical" ||
    normalized === "overdue" ||
    normalized === "lost"
  ) {
    classes =
      "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  } else if (
    normalized === "retired" ||
    normalized === "disposed" ||
    normalized === "cancelled" ||
    normalized === "inactive"
  ) {
    classes =
      "bg-slate-200 text-slate-700 ring-1 ring-slate-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes} ${className}`}
    >
      {status?.trim() || "Unknown"}
    </span>
  );
}
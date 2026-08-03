type StatsCardProps = {
  label: string;
  value: string | number;
  description?: string;
  accentClassName?: string;
  valueClassName?: string;
  loading?: boolean;
};

export default function StatsCard({
  label,
  value,
  description,
  accentClassName = "bg-slate-900",
  valueClassName = "text-slate-950",
  loading = false,
}: StatsCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`}
      />

      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-4 text-4xl font-bold tracking-tight ${valueClassName}`}
      >
        {loading ? "—" : value}
      </p>

      {description && (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}
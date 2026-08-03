import { LucideIcon } from "lucide-react";

type SystemHealthCardProps = {
  title: string;
  score: number;
  status: string;
  icon: LucideIcon;
};

export default function SystemHealthCard({
  title,
  score,
  status,
  icon: Icon,
}: SystemHealthCardProps) {
  const color =
    score >= 95
      ? "emerald"
      : score >= 80
      ? "amber"
      : "rose";

  const styles = {
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
      score: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
      score: "text-amber-700",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "bg-rose-100 text-rose-700",
      score: "text-rose-700",
    },
  }[color];

  return (
    <div
      className={`rounded-3xl border border-slate-200 ${styles.bg} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          <Icon size={20} />
        </div>

        <span className={`text-3xl font-black ${styles.score}`}>
          {score}%
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {status}
      </p>
    </div>
  );
}
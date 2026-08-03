type ReadinessCardProps = {
  score: number;
  summary: string;
};

export default function ReadinessCard({
  score,
  summary,
}: ReadinessCardProps) {
  const color =
    score >= 95
      ? "text-green-600"
      : score >= 80
      ? "text-amber-500"
      : "text-red-600";

  return (
    <div className="rounded-3xl border bg-white p-10 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
        Sunday Readiness
      </p>

      <h2 className={`mt-5 text-7xl font-black ${color}`}>
        {score}%
      </h2>

      <p className="mt-4 text-lg text-slate-600">
        {summary}
      </p>
    </div>
  );
}
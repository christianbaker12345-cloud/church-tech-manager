type MaintenanceStatsProps = {
  openCount: number;
  inProgressCount: number;
  highPriorityCount: number;
  totalRepairCost?: string;
  loading?: boolean;
};

export default function MaintenanceStats({
  openCount,
  inProgressCount,
  highPriorityCount,
  totalRepairCost,
  loading = false,
}: MaintenanceStatsProps) {
  const cards = [
    {
      label: "Open Repairs",
      value: loading ? "—" : openCount,
      valueClassName: "text-red-600",
    },
    {
      label: "In Progress",
      value: loading ? "—" : inProgressCount,
      valueClassName: "text-yellow-600",
    },
    {
      label: "High Priority",
      value: loading ? "—" : highPriorityCount,
      valueClassName: "text-orange-600",
    },
    ...(totalRepairCost
      ? [
          {
            label: "Recorded Repair Cost",
            value: loading ? "—" : totalRepairCost,
            valueClassName: "text-gray-900",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`grid gap-6 ${
        cards.length === 4
          ? "md:grid-cols-2 xl:grid-cols-4"
          : "md:grid-cols-3"
      }`}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl bg-white p-6 shadow"
        >
          <p className="text-gray-500">{card.label}</p>
          <p
            className={`mt-3 text-4xl font-bold ${card.valueClassName}`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
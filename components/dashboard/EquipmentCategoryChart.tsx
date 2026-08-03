"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type EquipmentCategoryRecord = {
  category: string | null;
  quantity: number | null;
};

type ChartRow = {
  category: string;
  quantity: number;
};

type TooltipPayload = {
  value?: number;
  payload?: ChartRow;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

function CustomTooltip({
  active,
  payload,
}: CustomTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="font-semibold text-slate-950">
        {row.category}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {row.quantity} equipment item
        {row.quantity === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function EquipmentCategoryChart() {
  const [records, setRecords] = useState<
    EquipmentCategoryRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment")
      .select("category,quantity");

    if (error) {
      console.error(
        "Equipment category chart load error:",
        error
      );
      setErrorMessage(error.message);
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as EquipmentCategoryRecord[]);
    setLoading(false);
  }

  const chartData = useMemo<ChartRow[]>(() => {
    const totals = new Map<string, number>();

    records.forEach((record) => {
      const category =
        record.category?.trim() || "Uncategorized";

      const quantity = Number(record.quantity) || 0;

      totals.set(
        category,
        (totals.get(category) ?? 0) + quantity
      );
    });

    return Array.from(totals.entries())
      .map(([category, quantity]) => ({
        category,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [records]);

  const totalQuantity = chartData.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const chartHeight = Math.max(
    320,
    chartData.length * 62
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Interactive Chart
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment by category
          </h2>

          <p className="mt-2 text-slate-500">
            Compare total equipment quantities across categories.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadChartData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">
            The category chart could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      ) : loading ? (
        <div className="mt-8 h-80 animate-pulse rounded-2xl bg-slate-100" />
      ) : chartData.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            📊
          </div>

          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            No chart data yet
          </h3>

          <p className="mt-2 text-slate-500">
            Add categories and quantities to equipment records to
            populate this chart.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Categories
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {chartData.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Total Quantity
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {totalQuantity}
              </p>
            </div>
          </div>

          <div
            className="mt-8 w-full"
            style={{ height: chartHeight }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 24,
                  bottom: 8,
                  left: 8,
                }}
                accessibilityLayer
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  tick={{ fill: "#334155", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />

                <Bar
                  dataKey="quantity"
                  fill="#2563eb"
                  radius={[0, 8, 8, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
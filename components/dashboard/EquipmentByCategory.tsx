"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type EquipmentCategoryRecord = {
  category: string | null;
  quantity: number | null;
};

type CategorySummary = {
  category: string;
  count: number;
};

function categoryIcon(category: string) {
  const normalized = category.trim().toLowerCase();

  if (
    normalized.includes("audio") ||
    normalized.includes("sound")
  ) {
    return "🎤";
  }

  if (
    normalized.includes("video") ||
    normalized.includes("broadcast") ||
    normalized.includes("camera")
  ) {
    return "📷";
  }

  if (
    normalized.includes("light") ||
    normalized.includes("dmx")
  ) {
    return "💡";
  }

  if (
    normalized.includes("music") ||
    normalized.includes("instrument")
  ) {
    return "🎹";
  }

  if (
    normalized.includes("it") ||
    normalized.includes("computer") ||
    normalized.includes("network")
  ) {
    return "💻";
  }

  return "📦";
}

export default function EquipmentByCategory() {
  const [records, setRecords] = useState<
    EquipmentCategoryRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCategoryData();
  }, []);

  async function loadCategoryData() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment")
      .select("category,quantity");

    if (error) {
      console.error(
        "Equipment category analytics load error:",
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

  const categories = useMemo<CategorySummary[]>(() => {
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
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const maxCount = Math.max(
    1,
    ...categories.map((category) => category.count)
  );

  const totalItems = categories.reduce(
    (total, category) => total + category.count,
    0
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment by category
          </h2>

          <p className="mt-2 text-slate-500">
            Distribution of equipment quantities across ministry
            categories.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadCategoryData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">
            Category analytics could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      ) : loading ? (
        <div className="mt-8 space-y-5">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-3 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            📊
          </div>

          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            No category data yet
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
                {categories.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Total Quantity
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {totalItems}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {categories.map((category) => {
              const percentage =
                totalItems > 0
                  ? Math.round(
                      (category.count / totalItems) * 100
                    )
                  : 0;

              const widthPercentage =
                (category.count / maxCount) * 100;

              return (
                <article key={category.category}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                        {categoryIcon(category.category)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {category.category}
                        </p>

                        <p className="mt-0.5 text-sm text-slate-500">
                          {percentage}% of total quantity
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-2xl font-bold text-slate-950">
                      {category.count}
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${Math.max(
                          widthPercentage,
                          category.count > 0 ? 4 : 0
                        )}%`,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
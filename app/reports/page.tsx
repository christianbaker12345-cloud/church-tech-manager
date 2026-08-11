"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  CircleDollarSign,
  Filter,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type EquipmentLifecycleRecord = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  purchase_date: string | null;
  expected_life_years: number | null;
  replacement_warning_months: number | null;
  estimated_replacement_cost: number | null;
  replacement_target_date: string | null;
};

type LifecycleStatus =
  | "Healthy"
  | "Planning Soon"
  | "Replacement Due"
  | "Past Expected Life";

type ForecastRecord = EquipmentLifecycleRecord & {
  status: LifecycleStatus;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getLifecycleStatus(
  targetDate: string,
  warningMonths: number
): LifecycleStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${targetDate}T00:00:00`);

  const warningDate = new Date(target);
  warningDate.setMonth(
    warningDate.getMonth() - warningMonths
  );

  if (today > target) {
    return "Past Expected Life";
  }

  if (today.getTime() === target.getTime()) {
    return "Replacement Due";
  }

  if (today >= warningDate) {
    return "Planning Soon";
  }

  return "Healthy";
}

function statusClass(status: LifecycleStatus) {
  switch (status) {
    case "Healthy":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "Planning Soon":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "Replacement Due":
      return "bg-orange-50 text-orange-700 ring-orange-200";

    case "Past Expected Life":
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

function totalEstimatedCost(
  items: EquipmentLifecycleRecord[]
) {
  return items.reduce(
    (total, item) =>
      total + (item.estimated_replacement_cost ?? 0),
    0
  );
}

export default function ReportsPage() {
  const [records, setRecords] = useState<
    EquipmentLifecycleRecord[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment")
      .select(`
        id,
        name,
        category,
        location,
        purchase_date,
        expected_life_years,
        replacement_warning_months,
        estimated_replacement_cost,
        replacement_target_date
      `)
      .not("replacement_target_date", "is", null)
      .order("replacement_target_date", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Capital replacement forecast error:",
        error
      );

      setErrorMessage(error.message);
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords(
      (data ?? []) as EquipmentLifecycleRecord[]
    );

    setLoading(false);
  }

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const currentYear = today.getFullYear();

  const forecastRecords = useMemo<ForecastRecord[]>(() => {
    return records.map((record) => {
      const warningMonths =
        record.replacement_warning_months ?? 12;

      const status = getLifecycleStatus(
        record.replacement_target_date!,
        warningMonths
      );

      return {
        ...record,
        status,
      };
    });
  }, [records]);

  const categories = useMemo(() => {
    const values = forecastRecords
      .map((record) => record.category?.trim())
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [forecastRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return forecastRecords.filter((record) => {
      const matchesCategory =
        categoryFilter === "All" ||
        record.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        record.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        record.category
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        record.location
          ?.toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesCategory &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    forecastRecords,
    categoryFilter,
    statusFilter,
    search,
  ]);

  function targetWithinYears(
    targetDate: string,
    years: number
  ) {
    const target = new Date(
      `${targetDate}T00:00:00`
    );

    const cutoff = new Date(today);
    cutoff.setFullYear(
      cutoff.getFullYear() + years
    );

    return target <= cutoff;
  }

  const planningNow = useMemo(() => {
    return filteredRecords.filter(
      (record) =>
        record.status === "Planning Soon" ||
        record.status === "Replacement Due" ||
        record.status === "Past Expected Life"
    );
  }, [filteredRecords]);

  const next12Months = useMemo(() => {
    return filteredRecords.filter((record) =>
      targetWithinYears(
        record.replacement_target_date!,
        1
      )
    );
  }, [filteredRecords, today]);

  const next3Years = useMemo(() => {
    return filteredRecords.filter((record) =>
      targetWithinYears(
        record.replacement_target_date!,
        3
      )
    );
  }, [filteredRecords, today]);

  const next5Years = useMemo(() => {
    return filteredRecords.filter((record) =>
      targetWithinYears(
        record.replacement_target_date!,
        5
      )
    );
  }, [filteredRecords, today]);

  const missingCostCount = filteredRecords.filter(
    (record) =>
      record.estimated_replacement_cost === null
  ).length;

  const fiveYearSummary = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      const year = currentYear + index;

      const items = filteredRecords.filter(
        (record) => {
          const targetYear = new Date(
            `${record.replacement_target_date}T00:00:00`
          ).getFullYear();

          return targetYear === year;
        }
      );

      return {
        year,
        items,
        total: totalEstimatedCost(items),
        missingCostCount: items.filter(
          (item) =>
            item.estimated_replacement_cost === null
        ).length,
      };
    });
  }, [
    filteredRecords,
    currentYear,
  ]);

  const fiveYearTotal = useMemo(() => {
    return fiveYearSummary.reduce(
      (total, year) => total + year.total,
      0
    );
  }, [fiveYearSummary]);

  const groupedByYear = useMemo(() => {
    const grouped = new Map<
      number,
      ForecastRecord[]
    >();

    filteredRecords.forEach((record) => {
      const year = new Date(
        `${record.replacement_target_date}T00:00:00`
      ).getFullYear();

      const current = grouped.get(year) ?? [];

      current.push(record);
      grouped.set(year, current);
    });

    return Array.from(grouped.entries()).sort(
      ([yearA], [yearB]) => yearA - yearB
    );
  }, [filteredRecords]);

  const hasActiveFilters =
    categoryFilter !== "All" ||
    statusFilter !== "All" ||
    search.trim().length > 0;

  function clearFilters() {
    setCategoryFilter("All");
    setStatusFilter("All");
    setSearch("");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-80 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Executive Planning
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Capital Replacement Forecast
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
            Forecast major equipment replacement needs
            using purchase dates, expected life, warning
            periods, and estimated replacement costs.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadForecast}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      {errorMessage && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">
            Forecast could not be loaded.
          </p>

          <p className="mt-1 text-sm">
            {errorMessage}
          </p>
        </section>
      )}

      {/* FILTERS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500">
              <Filter className="h-4 w-4" />

              <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                Forecast Filters
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Focus the forecast
            </h2>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search Equipment
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search equipment, category, or location..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Lifecycle Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Healthy">
                Healthy
              </option>

              <option value="Planning Soon">
                Planning Soon
              </option>

              <option value="Replacement Due">
                Replacement Due
              </option>

              <option value="Past Expected Life">
                Past Expected Life
              </option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <p className="mt-4 text-sm text-slate-500">
            Showing {filteredRecords.length} of{" "}
            {forecastRecords.length} lifecycle-planned
            equipment records.
          </p>
        )}
      </section>

      {/* SUMMARY CARDS */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ForecastCard
          label="Planning Now"
          value={money(
            totalEstimatedCost(planningNow)
          )}
          description={`${planningNow.length} item${
            planningNow.length === 1 ? "" : "s"
          } inside the planning window`}
        />

        <ForecastCard
          label="Next 12 Months"
          value={money(
            totalEstimatedCost(next12Months)
          )}
          description={`${next12Months.length} expected replacement${
            next12Months.length === 1 ? "" : "s"
          }`}
        />

        <ForecastCard
          label="Next 3 Years"
          value={money(
            totalEstimatedCost(next3Years)
          )}
          description={`${next3Years.length} expected replacement${
            next3Years.length === 1 ? "" : "s"
          }`}
        />

        <ForecastCard
          label="Next 5 Years"
          value={money(
            totalEstimatedCost(next5Years)
          )}
          description={`${next5Years.length} expected replacement${
            next5Years.length === 1 ? "" : "s"
          }`}
        />
      </section>

      {missingCostCount > 0 && (
        <section className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              {missingCostCount} lifecycle-planned item
              {missingCostCount === 1 ? "" : "s"} do not
              have an estimated replacement cost yet.
            </p>

            <p className="mt-1 text-sm leading-6">
              Forecast totals only include equipment with
              a replacement cost entered, so the actual
              capital need may be higher.
            </p>
          </div>
        </section>
      )}

      {/* FIVE YEAR PLAN */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 bg-slate-50 p-5 md:p-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarRange className="h-4 w-4" />

              <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                Five-Year Capital Plan
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Annual replacement outlook
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Projected replacement spending from{" "}
              {currentYear} through {currentYear + 4}.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Five-Year Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {money(fiveYearTotal)}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-5">
          {fiveYearSummary.map(
            ({
              year,
              items,
              total,
              missingCostCount,
            }) => (
              <div
                key={year}
                className="border-b border-slate-200 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <p className="text-sm font-bold text-slate-500">
                  {year}
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                  {money(total)}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {items.length} planned item
                  {items.length === 1 ? "" : "s"}
                </p>

                {missingCostCount > 0 && (
                  <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">
                    + {missingCostCount} without cost
                    estimate
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* TIMELINE */}

      {forecastRecords.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CircleDollarSign className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-xl font-bold text-slate-950">
            No lifecycle forecasts yet
          </h2>

          <p className="mt-2 text-slate-500">
            Add a purchase date and expected life to
            equipment to begin building the forecast.
          </p>
        </section>
      ) : filteredRecords.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Search className="mx-auto h-9 w-9 text-slate-400" />

          <h2 className="mt-4 text-xl font-bold text-slate-950">
            No equipment matches these filters
          </h2>

          <p className="mt-2 text-slate-500">
            Change the category, lifecycle status, or
            search terms to see more equipment.
          </p>

          <Button
            className="mt-5"
            variant="outline"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </section>
      ) : (
        <section className="space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Replacement Timeline
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Planned by year
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              All lifecycle-planned equipment, including
              items outside the five-year planning window.
            </p>
          </div>

          {groupedByYear.map(([year, items]) => {
            const yearTotal =
              totalEstimatedCost(items);

            const yearMissingCosts =
              items.filter(
                (item) =>
                  item.estimated_replacement_cost ===
                  null
              ).length;

            return (
              <div
                key={year}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-950">
                      {year}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {items.length} planned item
                      {items.length === 1 ? "" : "s"}

                      {yearMissingCosts > 0 && (
                        <>
                          {" "}
                          · {yearMissingCosts} without
                          cost estimate
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estimated Total
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {money(yearTotal)}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-950">
                            {item.name}
                          </h4>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          <span>
                            {item.category ||
                              "No category"}
                          </span>

                          <span>
                            {item.location ||
                              "No location"}
                          </span>

                          <span>
                            Target:{" "}
                            {formatDate(
                              item.replacement_target_date
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-left md:text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Replacement Cost
                          </p>

                          <p className="mt-1 font-bold text-slate-950">
                            {item.estimated_replacement_cost !==
                            null
                              ? money(
                                  item.estimated_replacement_cost
                                )
                              : "Cost not entered"}
                          </p>
                        </div>

                        <Link
                          href={`/inventory/${item.id}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

type ForecastCardProps = {
  label: string;
  value: string;
  description: string;
};

function ForecastCard({
  label,
  value,
  description,
}: ForecastCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
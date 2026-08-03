"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type AssetStatusRecord = {
  status: string | null;
  due_date: string | null;
};

type StatusSummary = {
  label: string;
  value: number;
  description: string;
  barClassName: string;
  badgeClassName: string;
};

function normalizeStatus(status: string | null) {
  return status?.trim().toLowerCase() ?? "";
}

export default function EquipmentStatusAnalytics() {
  const [records, setRecords] = useState<AssetStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadStatusData();
  }, []);

  async function loadStatusData() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("assets")
      .select("status,due_date");

    if (error) {
      console.error(
        "Equipment status analytics load error:",
        error
      );
      setErrorMessage(error.message);
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as AssetStatusRecord[]);
    setLoading(false);
  }

  const summaries = useMemo<StatusSummary[]>(() => {
    const today = new Date().toISOString().split("T")[0];

    const available = records.filter(
      (record) => normalizeStatus(record.status) === "available"
    ).length;

    const transferred = records.filter(
      (record) =>
        normalizeStatus(record.status) === "checked out"
    ).length;

    const maintenance = records.filter((record) => {
      const status = normalizeStatus(record.status);

      return status === "maintenance" || status === "in repair";
    }).length;

    const overdue = records.filter(
      (record) =>
        normalizeStatus(record.status) === "checked out" &&
        record.due_date !== null &&
        record.due_date < today
    ).length;

    return [
      {
        label: "Available",
        value: available,
        description: "Ready for regular use",
        barClassName: "bg-emerald-500",
        badgeClassName:
          "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      },
      {
        label: "Transferred",
        value: transferred,
        description: "Temporarily assigned elsewhere",
        barClassName: "bg-amber-500",
        badgeClassName:
          "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      },
      {
        label: "Maintenance",
        value: maintenance,
        description: "Unavailable due to repair or service",
        barClassName: "bg-rose-500",
        badgeClassName:
          "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      },
      {
        label: "Overdue",
        value: overdue,
        description: "Transferred past the due date",
        barClassName: "bg-orange-500",
        badgeClassName:
          "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
      },
    ];
  }, [records]);

  const totalTracked = records.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment status
          </h2>

          <p className="mt-2 text-slate-500">
            Live operational status across all individually tracked
            equipment.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadStatusData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">
            Status analytics could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      ) : loading ? (
        <div className="mt-8 space-y-5">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 p-5"
            >
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-3 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : totalTracked === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            📊
          </div>

          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            No equipment status data
          </h3>

          <p className="mt-2 text-slate-500">
            Add individually tracked equipment to populate this
            analytics card.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm font-medium text-slate-300">
              Total tracked equipment
            </p>

            <p className="mt-2 text-4xl font-bold">
              {totalTracked}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {summaries.map((summary) => {
              const percentage =
                totalTracked > 0
                  ? Math.round(
                      (summary.value / totalTracked) * 100
                    )
                  : 0;

              return (
                <article
                  key={summary.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-slate-950">
                          {summary.label}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${summary.badgeClassName}`}
                        >
                          {percentage}%
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {summary.description}
                      </p>
                    </div>

                    <p className="text-3xl font-bold text-slate-950">
                      {summary.value}
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full transition-all ${summary.barClassName}`}
                      style={{
                        width: `${Math.max(
                          percentage,
                          summary.value > 0 ? 4 : 0
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
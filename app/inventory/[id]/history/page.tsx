"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Archive,
  ArrowLeftRight,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type CheckoutHistory = {
  id: string;
  equipment_name: string | null;
  checked_out_by: string | null;
  ministry: string | null;
  checkout_date: string | null;
  due_date: string | null;
  checkin_date: string | null;
  status: string | null;
};

type LifecycleHistory = {
  id: string;
  equipment_id: string;
  action: string;
  reason: string | null;
  destination: string | null;
  notes: string | null;
  created_at: string;
};

type TimelineEvent =
  | {
      id: string;
      type: "checkout";
      date: string;
      checkout: CheckoutHistory;
    }
  | {
      id: string;
      type: "lifecycle";
      date: string;
      lifecycle: LifecycleHistory;
    };

export default function HistoryPage() {
  const params = useParams();

  const equipmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [checkoutHistory, setCheckoutHistory] = useState<
    CheckoutHistory[]
  >([]);
  const [lifecycleHistory, setLifecycleHistory] = useState<
    LifecycleHistory[]
  >([]);
  const [equipmentName, setEquipmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (equipmentId) {
      loadHistory();
    }
  }, [equipmentId]);

  async function loadHistory() {
    if (!equipmentId) return;

    setLoading(true);
    setErrorMessage("");

    const [equipmentResult, checkoutResult, lifecycleResult] =
      await Promise.all([
        supabase
          .from("equipment")
          .select("name")
          .eq("id", equipmentId)
          .maybeSingle(),

        supabase
          .from("checkout_history")
          .select("*")
          .eq("equipment_id", equipmentId)
          .order("checkout_date", { ascending: false }),

        supabase
          .from("equipment_lifecycle_history")
          .select("*")
          .eq("equipment_id", equipmentId)
          .order("created_at", { ascending: false }),
      ]);

    if (equipmentResult.error) {
      console.error(
        "Equipment history title error:",
        equipmentResult.error
      );
    } else {
      setEquipmentName(equipmentResult.data?.name ?? "");
    }

    if (checkoutResult.error) {
      console.error(
        "Checkout history load error:",
        checkoutResult.error
      );
      setErrorMessage(checkoutResult.error.message);
      setCheckoutHistory([]);
    } else {
      setCheckoutHistory(
        (checkoutResult.data ?? []) as CheckoutHistory[]
      );
    }

    if (lifecycleResult.error) {
      console.error(
        "Lifecycle history load error:",
        lifecycleResult.error
      );
      setErrorMessage((current) =>
        current
          ? `${current} ${lifecycleResult.error.message}`
          : lifecycleResult.error.message
      );
      setLifecycleHistory([]);
    } else {
      setLifecycleHistory(
        (lifecycleResult.data ?? []) as LifecycleHistory[]
      );
    }

    setLoading(false);
  }

  const timeline = useMemo<TimelineEvent[]>(() => {
    const checkoutEvents: TimelineEvent[] = checkoutHistory.map(
      (row) => ({
        id: `checkout-${row.id}`,
        type: "checkout",
        date:
          row.checkin_date ||
          row.checkout_date ||
          new Date(0).toISOString(),
        checkout: row,
      })
    );

    const lifecycleEvents: TimelineEvent[] =
      lifecycleHistory.map((row) => ({
        id: `lifecycle-${row.id}`,
        type: "lifecycle",
        date: row.created_at,
        lifecycle: row,
      }));

    return [...checkoutEvents, ...lifecycleEvents].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );
  }, [checkoutHistory, lifecycleHistory]);

  function formatDate(value: string | null) {
    if (!value) return "—";

    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const parsedDate = dateOnlyPattern.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function lifecyclePresentation(action: string) {
    const normalized = action.trim().toLowerCase();

    if (normalized === "retired") {
      return {
        icon: Archive,
        badge: "bg-violet-100 text-violet-700",
        iconBox: "bg-violet-100 text-violet-700",
      };
    }

    if (normalized === "moved to trash") {
      return {
        icon: Trash2,
        badge: "bg-rose-100 text-rose-700",
        iconBox: "bg-rose-100 text-rose-700",
      };
    }

    return {
      icon: RotateCcw,
      badge: "bg-emerald-100 text-emerald-700",
      iconBox: "bg-emerald-100 text-emerald-700",
    };
  }

  if (loading) {
    return (
      <div className="p-8 text-2xl font-bold">
        Loading history...
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href={`/inventory/${equipmentId}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Equipment
      </Link>

      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Equipment Record
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-950">
          Equipment History
        </h1>

        {equipmentName && (
          <p className="mt-2 text-lg text-slate-500">
            {equipmentName}
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <p className="font-semibold">
            Some history could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-950">
            No equipment history yet
          </h2>

          <p className="mt-2 text-slate-500">
            Checkouts, returns, retirements, Trash actions, and
            restores will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {timeline.map((event) => {
            if (event.type === "lifecycle") {
              const presentation = lifecyclePresentation(
                event.lifecycle.action
              );
              const Icon = presentation.icon;

              return (
                <article
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${presentation.iconBox}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${presentation.badge}`}
                        >
                          {event.lifecycle.action}
                        </span>

                        <time className="text-sm font-medium text-slate-500">
                          {formatDate(event.lifecycle.created_at)}
                        </time>
                      </div>

                      {(event.lifecycle.reason ||
                        event.lifecycle.destination) && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {event.lifecycle.reason && (
                            <div>
                              <p className="text-sm font-medium text-slate-500">
                                Reason
                              </p>
                              <p className="mt-1 font-semibold text-slate-950">
                                {event.lifecycle.reason}
                              </p>
                            </div>
                          )}

                          {event.lifecycle.destination && (
                            <div>
                              <p className="text-sm font-medium text-slate-500">
                                Destination
                              </p>
                              <p className="mt-1 font-semibold text-slate-950">
                                {event.lifecycle.destination}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {event.lifecycle.notes && (
                        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
                          {event.lifecycle.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            }

            const row = event.checkout;

            return (
              <article
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          row.status === "Returned"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status || "Checkout"}
                      </span>

                      <time className="text-sm font-medium text-slate-500">
                        {formatDate(
                          row.checkin_date || row.checkout_date
                        )}
                      </time>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <HistoryValue
                        label="Person"
                        value={row.checked_out_by || "Not recorded"}
                      />

                      <HistoryValue
                        label="Ministry"
                        value={row.ministry || "Not recorded"}
                      />

                      <HistoryValue
                        label="Checked Out"
                        value={formatDate(row.checkout_date)}
                      />

                      <HistoryValue
                        label="Returned"
                        value={formatDate(row.checkin_date)}
                      />
                    </div>

                    {row.due_date && (
                      <p className="mt-4 text-sm text-slate-500">
                        Due date:{" "}
                        <span className="font-semibold text-slate-700">
                          {formatDate(row.due_date)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

type HistoryValueProps = {
  label: string;
  value: string;
};

function HistoryValue({
  label,
  value,
}: HistoryValueProps) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
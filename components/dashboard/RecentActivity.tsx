"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type ActivityItem = {
  id: string;
  type:
    | "equipment_added"
    | "transfer_created"
    | "transfer_returned"
    | "maintenance_opened"
    | "maintenance_completed";
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
};

type EquipmentRecord = {
  id: string;
  name: string;
  created_at: string | null;
};

type TransferRecord = {
  id: string;
  asset_id: string;
  checked_out_by: string;
  department: string | null;
  checked_out_date: string;
  returned_date: string | null;
  created_at: string;
  updated_at: string | null;
  assets:
    | {
        display_name: string | null;
        asset_tag: string | null;
      }
    | {
        display_name: string | null;
        asset_tag: string | null;
      }[]
    | null;
};

type MaintenanceRecord = {
  id: string;
  asset_id: string;
  issue_title: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  completed_date: string | null;
  assets:
    | {
        display_name: string | null;
        asset_tag: string | null;
      }
    | {
        display_name: string | null;
        asset_tag: string | null;
      }[]
    | null;
};

function getRelatedAsset(
  value:
    | {
        display_name: string | null;
        asset_tag: string | null;
      }
    | {
        display_name: string | null;
        asset_tag: string | null;
      }[]
    | null
) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const differenceInSeconds = Math.round(
    (date.getTime() - Date.now()) / 1000
  );

  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const ranges = [
    { limit: 60, divisor: 1, unit: "second" as const },
    { limit: 3600, divisor: 60, unit: "minute" as const },
    { limit: 86400, divisor: 3600, unit: "hour" as const },
    { limit: 604800, divisor: 86400, unit: "day" as const },
    { limit: 2629800, divisor: 604800, unit: "week" as const },
    { limit: 31557600, divisor: 2629800, unit: "month" as const },
    {
      limit: Number.POSITIVE_INFINITY,
      divisor: 31557600,
      unit: "year" as const,
    },
  ];

  const absoluteDifference = Math.abs(differenceInSeconds);
  const range =
    ranges.find((item) => absoluteDifference < item.limit) ??
    ranges[ranges.length - 1];

  return formatter.format(
    Math.round(differenceInSeconds / range.divisor),
    range.unit
  );
}

function activityIcon(type: ActivityItem["type"]) {
  if (type === "equipment_added") return "＋";
  if (type === "transfer_created") return "🚚";
  if (type === "transfer_returned") return "✓";
  if (type === "maintenance_completed") return "✅";
  return "🔧";
}

function activityClasses(type: ActivityItem["type"]) {
  if (type === "equipment_added") {
    return "bg-blue-100 text-blue-700";
  }

  if (type === "transfer_created") {
    return "bg-amber-100 text-amber-700";
  }

  if (type === "transfer_returned") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (type === "maintenance_completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-rose-100 text-rose-700";
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRecentActivity();
  }, []);

  async function loadRecentActivity() {
    setLoading(true);
    setErrorMessage("");

    const [equipmentResult, transferResult, maintenanceResult] =
      await Promise.all([
        supabase
          .from("equipment")
          .select("id,name,created_at")
          .order("created_at", { ascending: false })
          .limit(8),

        supabase
          .from("equipment_transfers")
          .select(`
            id,
            asset_id,
            checked_out_by,
            department,
            checked_out_date,
            returned_date,
            created_at,
            updated_at,
            assets (
              display_name,
              asset_tag
            )
          `)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("asset_maintenance")
          .select(`
            id,
            asset_id,
            issue_title,
            status,
            created_at,
            updated_at,
            completed_date,
            assets (
              display_name,
              asset_tag
            )
          `)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const errors = [
      equipmentResult.error,
      transferResult.error,
      maintenanceResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Recent activity load error:", errors);
      setErrorMessage(
        errors
          .map((error) => error?.message)
          .filter(Boolean)
          .join(" ")
      );
    }

    const nextActivities: ActivityItem[] = [];

    if (!equipmentResult.error) {
      const equipment =
        (equipmentResult.data ?? []) as EquipmentRecord[];

      equipment.forEach((item) => {
        if (!item.created_at) return;

        nextActivities.push({
          id: `equipment-${item.id}`,
          type: "equipment_added",
          title: `${item.name} added`,
          description: "A new equipment record was created.",
          occurredAt: item.created_at,
          href: `/inventory/${item.id}`,
        });
      });
    }

    if (!transferResult.error) {
      const transfers =
        (transferResult.data ?? []) as TransferRecord[];

      transfers.forEach((transfer) => {
        const asset = getRelatedAsset(transfer.assets);
        const equipmentName =
          asset?.display_name ||
          asset?.asset_tag ||
          "Equipment";

        nextActivities.push({
          id: `transfer-created-${transfer.id}`,
          type: "transfer_created",
          title: `${equipmentName} transferred`,
          description: transfer.department
            ? `${transfer.checked_out_by} · ${transfer.department}`
            : transfer.checked_out_by,
          occurredAt: transfer.created_at,
          href: `/assets/${transfer.asset_id}`,
        });

        if (transfer.returned_date) {
          const returnedAt =
            transfer.updated_at ||
            `${transfer.returned_date}T12:00:00`;

          nextActivities.push({
            id: `transfer-returned-${transfer.id}`,
            type: "transfer_returned",
            title: `${equipmentName} returned`,
            description: "The equipment was marked available again.",
            occurredAt: returnedAt,
            href: `/assets/${transfer.asset_id}`,
          });
        }
      });
    }

    if (!maintenanceResult.error) {
      const maintenanceRecords =
        (maintenanceResult.data ?? []) as MaintenanceRecord[];

      maintenanceRecords.forEach((record) => {
        const asset = getRelatedAsset(record.assets);
        const equipmentName =
          asset?.display_name ||
          asset?.asset_tag ||
          "Equipment";

        nextActivities.push({
          id: `maintenance-opened-${record.id}`,
          type: "maintenance_opened",
          title: `Maintenance opened for ${equipmentName}`,
          description: record.issue_title,
          occurredAt: record.created_at,
          href: `/assets/${record.asset_id}/maintenance`,
        });

        if (
          record.status.trim().toLowerCase() === "completed" ||
          record.completed_date
        ) {
          const completedAt =
            record.updated_at ||
            (record.completed_date
              ? `${record.completed_date}T12:00:00`
              : record.created_at);

          nextActivities.push({
            id: `maintenance-completed-${record.id}`,
            type: "maintenance_completed",
            title: `Maintenance completed for ${equipmentName}`,
            description: record.issue_title,
            occurredAt: completedAt,
            href: `/assets/${record.asset_id}/maintenance`,
          });
        }
      });
    }

    nextActivities.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() -
        new Date(a.occurredAt).getTime()
    );

    setActivities(nextActivities.slice(0, 10));
    setLoading(false);
  }

  const visibleActivities = useMemo(
    () => activities.slice(0, 8),
    [activities]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Live Operations
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Recent activity
          </h2>

          <p className="mt-2 text-slate-500">
            The latest equipment, transfer, and maintenance changes.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadRecentActivity}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold">
            Some activity could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-5">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex animate-pulse gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-200" />

              <div className="flex-1">
                <div className="h-4 w-56 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleActivities.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            🕒
          </div>

          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            No recent activity
          </h3>

          <p className="mt-2 text-slate-500">
            New equipment, transfers, and maintenance activity will
            appear here.
          </p>
        </div>
      ) : (
        <div className="relative mt-8">
          <div className="absolute bottom-0 left-[21px] top-0 w-px bg-slate-200" />

          <div className="space-y-2">
            {visibleActivities.map((activity) => {
              const content = (
                <article className="group relative flex gap-4 rounded-xl p-3 transition hover:bg-slate-50">
                  <div
                    className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold shadow-sm ${activityClasses(
                      activity.type
                    )}`}
                  >
                    {activityIcon(activity.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-950">
                          {activity.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {activity.description}
                        </p>
                      </div>

                      <time
                        dateTime={activity.occurredAt}
                        className="shrink-0 text-xs font-medium text-slate-400"
                      >
                        {formatRelativeTime(activity.occurredAt)}
                      </time>
                    </div>
                  </div>
                </article>
              );

              return activity.href ? (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <div key={activity.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
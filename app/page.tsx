"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CriticalRepairs from "@/components/dashboard/CriticalRepairs";
import EquipmentByCategory from "@/components/dashboard/EquipmentByCategory";
import EquipmentStatusAnalytics from "@/components/dashboard/EquipmentStatusAnalytics";
import EquipmentCategoryChart from "@/components/dashboard/EquipmentCategoryChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SundayReadiness from "@/components/dashboard/SundayReadiness";
import UpcomingMaintenance, {
  type UpcomingMaintenanceRecord,
} from "@/components/dashboard/UpcomingMaintenance";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import StatsCard from "@/components/ui/StatsCard";
import { supabase } from "@/lib/supabase";

type EquipmentSummary = {
  status: string | null;
  due_date: string | null;
};

type DashboardStats = {
  total: number;
  available: number;
  transferred: number;
  maintenance: number;
  overdue: number;
  criticalRepairs: number;
};

const emptyStats: DashboardStats = {
  total: 0,
  available: 0,
  transferred: 0,
  maintenance: 0,
  overdue: 0,
  criticalRepairs: 0,
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<
    UpcomingMaintenanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  function normalizeStatus(status: string | null) {
    return status?.trim().toLowerCase() ?? "";
  }

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    const today = new Date().toISOString().split("T")[0];

    const [
      equipmentResult,
      upcomingMaintenanceResult,
      criticalRepairsResult,
    ] = await Promise.all([
      supabase.from("assets").select("status,due_date"),

      supabase
        .from("asset_maintenance")
        .select(`
          id,
          asset_id,
          issue_title,
          next_service_date,
          assets (
            display_name,
            asset_tag
          )
        `)
        .not("next_service_date", "is", null)
        .gte("next_service_date", today)
        .order("next_service_date", { ascending: true })
        .limit(5),

      supabase
        .from("asset_maintenance")
        .select("id")
        .in("status", ["Open", "In Progress"])
        .in("priority", ["High", "Urgent"]),
    ]);

    if (equipmentResult.error) {
      console.error(
        "Dashboard equipment load error:",
        equipmentResult.error
      );
      setErrorMessage(equipmentResult.error.message);
      setStats(emptyStats);
      setUpcomingMaintenance([]);
      setLoading(false);
      return;
    }

    const dashboardErrors: string[] = [];

    if (upcomingMaintenanceResult.error) {
  console.error(
    "Upcoming maintenance load error:",
    upcomingMaintenanceResult.error
  );

  dashboardErrors.push(
    upcomingMaintenanceResult.error.message
  );

  setUpcomingMaintenance([]);
} else {
  const normalizedMaintenance = (
    upcomingMaintenanceResult.data ?? []
  ).map((record) => ({
    ...record,
    assets: Array.isArray(record.assets)
      ? record.assets[0] ?? null
      : record.assets,
  }));

  setUpcomingMaintenance(
    normalizedMaintenance as UpcomingMaintenanceRecord[]
  );
}

    if (criticalRepairsResult.error) {
      console.error(
        "Critical repairs count error:",
        criticalRepairsResult.error
      );
      dashboardErrors.push(criticalRepairsResult.error.message);
    }

    if (dashboardErrors.length > 0) {
      setErrorMessage(dashboardErrors.join(" "));
    }

    const equipmentItems =
      (equipmentResult.data ?? []) as EquipmentSummary[];

    const available = equipmentItems.filter(
      (item) => normalizeStatus(item.status) === "available"
    ).length;

    const transferred = equipmentItems.filter(
      (item) => normalizeStatus(item.status) === "checked out"
    ).length;

    const maintenance = equipmentItems.filter((item) => {
      const status = normalizeStatus(item.status);

      return status === "maintenance" || status === "in repair";
    }).length;

    const overdue = equipmentItems.filter(
      (item) =>
        normalizeStatus(item.status) === "checked out" &&
        item.due_date !== null &&
        item.due_date < today
    ).length;

    const criticalRepairs = criticalRepairsResult.error
      ? 0
      : (criticalRepairsResult.data ?? []).length;

    setStats({
      total: equipmentItems.length,
      available,
      transferred,
      maintenance,
      overdue,
      criticalRepairs,
    });

    setLoading(false);
  }

  const maintenanceCount = Number.isFinite(stats.maintenance)
    ? stats.maintenance
    : 0;

  const criticalRepairsCount = Number.isFinite(
    stats.criticalRepairs
  )
    ? stats.criticalRepairs
    : 0;

  const overdueCount = Number.isFinite(stats.overdue)
    ? stats.overdue
    : 0;

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        maintenanceCount * 5 -
        criticalRepairsCount * 10 -
        overdueCount * 5
    )
  );

  const statCards = useMemo(
    () => [
      {
        label: "Total Equipment",
        value: stats.total,
        description: "Tracked individual items",
        accentClassName: "bg-slate-900",
        valueClassName: "text-slate-950",
      },
      {
        label: "Available",
        value: stats.available,
        description: "Ready for regular use",
        accentClassName: "bg-emerald-500",
        valueClassName: "text-emerald-700",
      },
      {
        label: "Transferred",
        value: stats.transferred,
        description: "Temporarily assigned elsewhere",
        accentClassName: "bg-amber-500",
        valueClassName: "text-amber-700",
      },
      {
        label: "Maintenance",
        value: stats.maintenance,
        description: "Unavailable for service",
        accentClassName: "bg-rose-500",
        valueClassName: "text-rose-700",
      },
      {
        label: "Overdue Return",
        value: stats.overdue,
        description: "Past the expected return date",
        accentClassName: "bg-orange-500",
        valueClassName: "text-orange-700",
      },
    ],
    [stats]
  );

  const quickActions = [
    {
      href: "/inventory/new",
      title: "Add Equipment",
      description: "Create a new equipment record.",
      icon: "＋",
    },
    {
      href: "/inventory",
      title: "View Equipment",
      description: "Search and manage the full equipment list.",
      icon: "📦",
    },
    {
      href: "/maintenance",
      title: "Maintenance",
      description: "Review repairs and upcoming service.",
      icon: "🔧",
    },
    {
      href: "/transfers",
      title: "Transfers",
      description: "Track equipment moved to another space or team.",
      icon: "🚚",
    },
    {
      href: "/tools/export",
      title: "Export Center",
      description: "Download operational data as CSV files.",
      icon: "📤",
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Operations Dashboard"
        title={`${getGreeting()}, Christian`}
        description={formatToday()}
        actions={
          <>
            <Button
              variant="outline"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>

            <Link href="/inventory/new">
              <Button>Add Equipment</Button>
            </Link>
          </>
        }
      />

      {errorMessage && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
          <p className="font-semibold">
            Some dashboard information could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadDashboard}
          >
            Try Again
          </Button>
        </section>
      )}

      <section>
        <SundayReadiness
          score={loading ? 0 : readinessScore}
          equipmentInMaintenance={
            loading ? 0 : maintenanceCount
          }
          criticalRepairs={
            loading ? 0 : criticalRepairsCount
          }
          overdueTransfers={loading ? 0 : overdueCount}
        />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Equipment Health
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Current status
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <StatsCard
              key={card.label}
              label={card.label}
              value={card.value}
              description={card.description}
              accentClassName={card.accentClassName}
              valueClassName={card.valueClassName}
              loading={loading}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment distribution
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <EquipmentByCategory />
          <EquipmentCategoryChart />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment status
          </h2>
        </div>

        <EquipmentStatusAnalytics />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Operations
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Recent activity
          </h2>
        </div>

        <RecentActivity />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Attention
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            What needs action
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <CriticalRepairs />

          <UpcomingMaintenance
            records={upcomingMaintenance}
          />
        </div>
      </section>

      <SectionCard
        eyebrow="Shortcuts"
        title="Quick actions"
        description="Jump directly into the most common operational tasks."
        contentClassName="pt-6"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                {action.icon}
              </div>

              <h3 className="mt-4 font-semibold text-slate-950">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {action.description}
              </p>

              <p className="mt-4 text-sm font-medium text-blue-600">
                Open →
              </p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
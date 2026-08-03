"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CriticalRepairs from "@/components/dashboard/CriticalRepairs";
import SundayReadiness from "@/components/dashboard/SundayReadiness";
import UpcomingMaintenance, {
  type UpcomingMaintenanceRecord,
} from "@/components/dashboard/UpcomingMaintenance";
import { Button } from "@/components/ui/button";
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
      dashboardErrors.push(upcomingMaintenanceResult.error.message);
      setUpcomingMaintenance([]);
    } else {
      setUpcomingMaintenance(
        (upcomingMaintenanceResult.data ??
          []) as UpcomingMaintenanceRecord[]
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

  const cards = [
    {
      label: "Total Equipment",
      value: stats.total,
      valueClassName: "text-gray-900",
    },
    {
      label: "Available",
      value: stats.available,
      valueClassName: "text-green-600",
    },
    {
      label: "Transferred",
      value: stats.transferred,
      valueClassName: "text-yellow-600",
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      valueClassName: "text-red-600",
    },
    {
      label: "Overdue Return",
      value: stats.overdue,
      valueClassName: "text-orange-600",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>

          <p className="mt-2 text-gray-500">
            Welcome to Church Tech Manager
          </p>
        </div>

        <Link href="/inventory/new">
          <Button>Add Equipment</Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
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
        </div>
      )}

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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white p-6 shadow"
          >
            <p className="text-gray-500">{card.label}</p>

            <h2
              className={`mt-3 text-4xl font-bold ${card.valueClassName}`}
            >
              {loading ? "—" : card.value}
            </h2>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <CriticalRepairs />

        <UpcomingMaintenance
          records={upcomingMaintenance}
        />
      </div>

      <div className="mt-10 rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Quick Actions</h2>

            <p className="mt-1 text-gray-500">
              Manage equipment, repairs, and temporary transfers.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Dashboard"}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/inventory">
            <Button>View Equipment</Button>
          </Link>

          <Link href="/maintenance">
            <Button variant="outline">View Maintenance</Button>
          </Link>

          <Link href="/tools/export">
            <Button variant="outline">Export Center</Button>
          </Link>

          <Link href="/inventory/new">
            <Button variant="outline">Add Equipment</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
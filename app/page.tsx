"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type AssetSummary = {
  status: string | null;
  due_date: string | null;
};

type DashboardStats = {
  total: number;
  available: number;
  checkedOut: number;
  maintenance: number;
  overdue: number;
};

const emptyStats: DashboardStats = {
  total: 0,
  available: 0,
  checkedOut: 0,
  maintenance: 0,
  overdue: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
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

    const { data, error } = await supabase
      .from("assets")
      .select("status,due_date");

    if (error) {
      console.error("Dashboard load error:", error);
      setErrorMessage(error.message);
      setStats(emptyStats);
      setLoading(false);
      return;
    }

    const assets = (data ?? []) as AssetSummary[];
    const today = new Date().toISOString().split("T")[0];

    const available = assets.filter(
      (asset) => normalizeStatus(asset.status) === "available"
    ).length;

    const checkedOut = assets.filter(
      (asset) => normalizeStatus(asset.status) === "checked out"
    ).length;

    const maintenance = assets.filter((asset) => {
      const status = normalizeStatus(asset.status);

      return status === "maintenance" || status === "in repair";
    }).length;

    const overdue = assets.filter((asset) => {
      return (
        normalizeStatus(asset.status) === "checked out" &&
        asset.due_date !== null &&
        asset.due_date < today
      );
    }).length;

    setStats({
      total: assets.length,
      available,
      checkedOut,
      maintenance,
      overdue,
    });

    setLoading(false);
  }

  const cards = [
    {
      label: "Total Assets",
      value: stats.total,
      valueClassName: "text-gray-900",
    },
    {
      label: "Available",
      value: stats.available,
      valueClassName: "text-green-600",
    },
    {
      label: "Checked Out",
      value: stats.checkedOut,
      valueClassName: "text-yellow-600",
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      valueClassName: "text-red-600",
    },
    {
      label: "Overdue",
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
          <p className="font-semibold">Dashboard could not be loaded.</p>
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

      <div className="mt-10 rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Quick Actions</h2>

            <p className="mt-1 text-gray-500">
              Manage your inventory and individual assets.
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
            <Button>View Inventory</Button>
          </Link>

          <Link href="/inventory/new">
            <Button variant="outline">Add Equipment</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
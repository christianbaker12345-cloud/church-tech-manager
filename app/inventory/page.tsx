"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, PackageCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";

type Equipment = {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  status: string | null;
  location: string | null;
  notes: string | null;
  created_at?: string | null;
  retired_at: string | null;
  retired_reason: string | null;
  retired_destination: string | null;
  retired_notes: string | null;
  trashed_at: string | null;
  trash_purge_after: string | null;
  trash_reason: string | null;
};

type LifecycleFilter = "Active" | "Retired" | "Trash";

type LifecycleCounts = {
  active: number;
  retired: number;
  trash: number;
};

function normalizeStatus(status: string | null) {
  return status?.trim().toLowerCase() ?? "";
}

function statusClasses(status: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "available") {
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (normalized === "checked out") {
    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  if (
    normalized === "maintenance" ||
    normalized === "in repair"
  ) {
    return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export default function InventoryPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LifecycleFilter>("Active");
  const [lifecycleCounts, setLifecycleCounts] =
    useState<LifecycleCounts>({
      active: 0,
      retired: 0,
      trash: 0,
    });

  useEffect(() => {
    loadEquipment();
  }, [lifecycleFilter]);

  async function loadEquipment() {
    setLoading(true);
    setErrorMessage("");

    const [
      activeCountResult,
      retiredCountResult,
      trashCountResult,
    ] = await Promise.all([
      supabase
        .from("equipment")
        .select("id", { count: "exact", head: true })
        .is("retired_at", null)
        .is("trashed_at", null),

      supabase
        .from("equipment")
        .select("id", { count: "exact", head: true })
        .not("retired_at", "is", null)
        .is("trashed_at", null),

      supabase
        .from("equipment")
        .select("id", { count: "exact", head: true })
        .not("trashed_at", "is", null),
    ]);

    setLifecycleCounts({
      active: activeCountResult.count ?? 0,
      retired: retiredCountResult.count ?? 0,
      trash: trashCountResult.count ?? 0,
    });

    let query = supabase
      .from("equipment")
      .select("*")
      .order("name", { ascending: true });

    if (lifecycleFilter === "Active") {
      query = query
        .is("retired_at", null)
        .is("trashed_at", null);
    }

    if (lifecycleFilter === "Retired") {
      query = query
        .not("retired_at", "is", null)
        .is("trashed_at", null);
    }

    if (lifecycleFilter === "Trash") {
      query = query.not("trashed_at", "is", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Equipment load error:", error);
      setErrorMessage(error.message);
      setEquipment([]);
      setLoading(false);
      return;
    }

    setEquipment((data ?? []) as Equipment[]);
    setLoading(false);
  }

  const categories = useMemo(() => {
    const values = equipment
      .map((item) => item.category)
      .filter(
        (category): category is string =>
          Boolean(category && category.trim())
      );

    return Array.from(new Set(values)).sort();
  }, [equipment]);

  const statuses = useMemo(() => {
    const values = equipment
      .map((item) => item.status)
      .filter(
        (status): status is string =>
          Boolean(status && status.trim())
      );

    return Array.from(new Set(values)).sort();
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category?.toLowerCase().includes(normalizedSearch) ||
        item.location?.toLowerCase().includes(normalizedSearch) ||
        item.status?.toLowerCase().includes(normalizedSearch) ||
        item.notes?.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    equipment,
    search,
    categoryFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    return {
      totalTypes: equipment.length,
      totalItems: equipment.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
      ),
      available: equipment.filter(
        (item) => normalizeStatus(item.status) === "available"
      ).length,
      attention: equipment.filter((item) => {
        const status = normalizeStatus(item.status);

        return (
          status === "maintenance" ||
          status === "in repair" ||
          status === "checked out"
        );
      }).length,
    };
  }, [equipment]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  function changeLifecycleFilter(nextFilter: LifecycleFilter) {
    setLifecycleFilter(nextFilter);
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  const statCards = [
    {
      label: "Equipment Types",
      value: summary.totalTypes,
      description: "Catalog records",
      accentClassName: "bg-slate-900",
      valueClassName: "text-slate-950",
    },
    {
      label: "Total Quantity",
      value: summary.totalItems,
      description: "Items represented",
      accentClassName: "bg-blue-500",
      valueClassName: "text-blue-700",
    },
    {
      label: "Available Types",
      value: summary.available,
      description: "Ready for regular use",
      accentClassName: "bg-emerald-500",
      valueClassName: "text-emerald-700",
    },
    {
      label: "Needs Attention",
      value: summary.attention,
      description: "Transferred or under repair",
      accentClassName: "bg-amber-500",
      valueClassName: "text-amber-700",
    },
  ];

  const lifecycleTabs = [
    {
      label: "Active" as const,
      count: lifecycleCounts.active,
      icon: PackageCheck,
      description: "Currently in service",
    },
    {
      label: "Retired" as const,
      count: lifecycleCounts.retired,
      icon: Archive,
      description: "History preserved",
    },
    {
      label: "Trash" as const,
      count: lifecycleCounts.trash,
      icon: Trash2,
      description: "Recoverable for 30 days",
    },
  ];

  const lifecycleCopy = {
    Active: {
      eyebrow: "Active Inventory",
      title: "Equipment records",
      emptyTitle: "No active equipment found",
      emptyDescription:
        "Add equipment or adjust your search and filters.",
    },
    Retired: {
      eyebrow: "Retired Equipment",
      title: "Retired records",
      emptyTitle: "No retired equipment found",
      emptyDescription:
        "Equipment you retire will remain searchable here.",
    },
    Trash: {
      eyebrow: "Equipment Trash",
      title: "Deleted records",
      emptyTitle: "Trash is empty",
      emptyDescription:
        "Records moved to Trash will remain recoverable here for 30 days.",
    },
  }[lifecycleFilter];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Equipment Management
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Inventory
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Browse equipment records, review availability, and open
            individual equipment groups.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/tools/import">
            <Button variant="outline">Import CSV</Button>
          </Link>

          <Link href="/tools/export">
            <Button variant="outline">Export Center</Button>
          </Link>

          <Link href="/inventory/new">
            <Button>Add Equipment</Button>
          </Link>
        </div>
      </header>

      {errorMessage && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
          <p className="font-semibold">
            Equipment could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadEquipment}
          >
            Try Again
          </Button>
        </section>
      )}

      <section>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${card.accentClassName}`}
              />

              <p className="text-sm font-medium text-slate-500">
                {card.label}
              </p>

              <p
                className={`mt-4 text-4xl font-bold tracking-tight ${card.valueClassName}`}
              >
                {card.value}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {lifecycleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = lifecycleFilter === tab.label;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => changeLifecycleFilter(tab.label)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  active
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-500 shadow-sm"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0">
                  <span
                    className={`block text-base font-bold ${
                      active ? "text-blue-950" : "text-slate-950"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </span>

                  <span
                    className={`mt-0.5 block text-sm ${
                      active ? "text-blue-700" : "text-slate-500"
                    }`}
                  >
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Find Equipment
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Search and filters
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}

            <Button
              variant="outline"
              onClick={loadEquipment}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, category, location, status, or notes..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All Statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {lifecycleCopy.eyebrow}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {lifecycleCopy.title}
            </h2>

            <p className="mt-2 text-slate-500">
              Showing {filteredEquipment.length} of{" "}
              {equipment.length} records
            </p>
          </div>
        </div>

        {filteredEquipment.length === 0 ? (
          <div className="p-8 md:p-12">
            <EmptyState
              icon="📦"
              title={lifecycleCopy.emptyTitle}
              description={lifecycleCopy.emptyDescription}
              secondaryAction={
                hasActiveFilters
                  ? {
                      label: "Clear Filters",
                      variant: "outline",
                      onClick: clearFilters,
                    }
                  : undefined
              }
              primaryAction={
                lifecycleFilter === "Active"
                  ? {
                      label: "Add Equipment",
                      href: "/inventory/new",
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Equipment
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Location
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEquipment.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                          📦
                        </div>

                        <div>
                          <p className="font-semibold text-slate-950">
                            {item.name}
                          </p>

                          {item.notes ? (
                            <p className="mt-1 max-w-lg truncate text-sm text-slate-500">
                              {item.notes}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-400">
                              No notes
                            </p>
                          )}

                          {lifecycleFilter === "Retired" && (
                            <p className="mt-2 text-xs font-semibold text-violet-700">
                              {item.retired_reason || "Retired"}
                              {item.retired_destination
                                ? ` · ${item.retired_destination}`
                                : ""}
                            </p>
                          )}

                          {lifecycleFilter === "Trash" && (
                            <p className="mt-2 text-xs font-semibold text-rose-700">
                              {item.trash_reason || "Moved to Trash"}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-700">
                      {item.category ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          {item.category}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-800">
                        {Number(item.quantity) || 0}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusClasses(
                          item.status
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-slate-700">
                      {item.location || "—"}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
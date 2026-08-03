"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Equipment = {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  status: string | null;
  location: string | null;
  notes: string | null;
  created_at?: string | null;
};

export default function InventoryPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadEquipment();
  }, []);

  async function loadEquipment() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("name", { ascending: true });

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
        item.status?.toLowerCase().includes(normalizedSearch);

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

  function normalizeStatus(status: string | null) {
    return status?.trim().toLowerCase() ?? "";
  }

  function statusClasses(status: string | null) {
    const normalized = normalizeStatus(status);

    if (normalized === "available") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "checked out") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (
      normalized === "maintenance" ||
      normalized === "in repair"
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Loading equipment...
        </h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Equipment Management
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Equipment
          </h1>

          <p className="mt-2 text-gray-500">
            Manage equipment records and individual equipment items.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/tools/export">
            <Button variant="outline">Export Center</Button>
          </Link>

          <Link href="/inventory/new">
            <Button>Add Equipment</Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, category, location..."
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category
          </label>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
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
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
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

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Equipment
            </h2>

            <p className="mt-1 text-gray-500">
              Showing {filteredEquipment.length} of{" "}
              {equipment.length} records
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadEquipment}
          >
            Refresh
          </Button>
        </div>

        {filteredEquipment.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
            <h3 className="text-xl font-semibold">
              No equipment found
            </h3>

            <p className="mt-2 text-gray-500">
              Add equipment or adjust your filters.
            </p>

            <Link
              href="/inventory/new"
              className="mt-5 inline-block"
            >
              <Button>Add Equipment</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Equipment</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Quantity</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEquipment.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="font-semibold">
                        {item.name}
                      </div>

                      {item.notes && (
                        <div className="mt-1 max-w-md truncate text-sm text-gray-500">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {item.category || "—"}
                    </td>

                    <td className="p-4">
                      {Number(item.quantity) || 0}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses(
                          item.status
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.location || "—"}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Equipment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
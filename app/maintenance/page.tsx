"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MaintenanceList from "@/components/maintenance/MaintenanceList";
import MaintenanceStats from "@/components/maintenance/MaintenanceStats";
import {
  formatMaintenanceCurrency,
  type MaintenanceRecord,
} from "@/components/maintenance/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type MaintenanceGroup = {
  title: string;
  description: string;
  records: MaintenanceRecord[];
};

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("asset_maintenance")
      .select(
        `
          *,
          assets (
            id,
            asset_tag,
            display_name,
            status,
            location
          )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Maintenance records load error:", error);
      setErrorMessage(error.message);
      setRecords([]);
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as MaintenanceRecord[]);
    setLoading(false);
  }

  const groups = useMemo<MaintenanceGroup[]>(() => {
    return [
      {
        title: "Open Issues",
        description: "New equipment issues that need attention.",
        records: records.filter((record) => record.status === "Open"),
      },
      {
        title: "In Progress",
        description: "Repairs currently being worked on.",
        records: records.filter(
          (record) => record.status === "In Progress"
        ),
      },
      {
        title: "Completed",
        description: "Repairs and service that have been finished.",
        records: records.filter(
          (record) => record.status === "Completed"
        ),
      },
      {
        title: "Cancelled",
        description: "Records that were closed without a repair.",
        records: records.filter(
          (record) => record.status === "Cancelled"
        ),
      },
    ];
  }, [records]);

  const openCount = records.filter(
    (record) => record.status === "Open"
  ).length;

  const inProgressCount = records.filter(
    (record) => record.status === "In Progress"
  ).length;

  const highPriorityCount = records.filter(
    (record) =>
      record.status !== "Completed" &&
      record.status !== "Cancelled" &&
      (record.priority === "High" ||
        record.priority === "Urgent")
  ).length;

  const totalRepairCost = records.reduce(
    (total, record) => total + (record.repair_cost ?? 0),
    0
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Maintenance</h1>
          <p className="mt-2 text-gray-500">
            Track repairs and equipment that needs attention.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadRecords}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">
            Maintenance could not be loaded.
          </p>
          <p className="mt-1 text-sm">{errorMessage}</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadRecords}
          >
            Try Again
          </Button>
        </div>
      )}

      <MaintenanceStats
        openCount={openCount}
        inProgressCount={inProgressCount}
        highPriorityCount={highPriorityCount}
        totalRepairCost={formatMaintenanceCurrency(
          totalRepairCost
        )}
        loading={loading}
      />

      {loading ? (
        <div className="mt-8 rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-500">
            Loading maintenance records...
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow">
          <h2 className="text-2xl font-bold">
            No maintenance records yet
          </h2>
          <p className="mt-2 text-gray-500">
            Report an issue from an equipment details page to create
            the first record.
          </p>

          <Link href="/inventory" className="mt-6 inline-block">
            <Button>View Equipment</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section
              key={group.title}
              className="rounded-2xl bg-white p-8 shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-gray-500">
                    {group.description}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {group.records.length}
                </span>
              </div>

              <div className="mt-6">
                <MaintenanceList
                  records={group.records}
                  emptyTitle={`No ${group.title.toLowerCase()}`}
                  emptyMessage="No maintenance records are currently in this section."
                  showEquipment
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
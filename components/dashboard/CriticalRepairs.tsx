"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type EquipmentSummary = {
  id: string;
  asset_tag: string | null;
  display_name: string | null;
};

type CriticalRepair = {
  id: string;
  asset_id: string;
  issue_title: string;
  description: string | null;
  priority: "High" | "Urgent";
  status: "Open" | "In Progress";
  opened_date: string;
  assets: EquipmentSummary | EquipmentSummary[] | null;
};

export default function CriticalRepairs() {
  const [repairs, setRepairs] = useState<CriticalRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCriticalRepairs();
  }, []);

  async function loadCriticalRepairs() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("asset_maintenance")
      .select(`
        id,
        asset_id,
        issue_title,
        description,
        priority,
        status,
        opened_date,
        assets (
          id,
          asset_tag,
          display_name
        )
      `)
      .in("status", ["Open", "In Progress"])
      .in("priority", ["High", "Urgent"])
      .order("opened_date", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Critical repairs load error:", error);
      setErrorMessage(error.message);
      setRepairs([]);
      setLoading(false);
      return;
    }

    setRepairs((data ?? []) as CriticalRepair[]);
    setLoading(false);
  }

  function getEquipment(repair: CriticalRepair) {
    if (Array.isArray(repair.assets)) {
      return repair.assets[0] ?? null;
    }

    return repair.assets;
  }

  function priorityClasses(priority: CriticalRepair["priority"]) {
    return priority === "Urgent"
      ? "bg-red-100 text-red-700"
      : "bg-orange-100 text-orange-700";
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Critical Repairs</h2>

          <p className="mt-1 text-gray-500">
            High-priority equipment issues needing attention.
          </p>
        </div>

        <Link href="/maintenance">
          <Button variant="outline">View All</Button>
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-gray-500">
          Loading critical repairs...
        </p>
      ) : errorMessage ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">
            Critical repairs could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadCriticalRepairs}
          >
            Try Again
          </Button>
        </div>
      ) : repairs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
          <h3 className="text-xl font-semibold">
            No critical repairs
          </h3>

          <p className="mt-2 text-gray-500">
            There are no open High or Urgent maintenance records.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {repairs.map((repair) => {
            const equipment = getEquipment(repair);

            const equipmentName =
              equipment?.display_name ||
              equipment?.asset_tag ||
              "Unnamed Equipment";

            return (
              <article
                key={repair.id}
                className="rounded-xl border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses(
                        repair.priority
                      )}`}
                    >
                      {repair.priority}
                    </span>

                    <h3 className="mt-3 text-lg font-bold">
                      {equipmentName}
                    </h3>

                    <p className="mt-1 font-medium text-gray-700">
                      {repair.issue_title}
                    </p>

                    {repair.description && (
                      <p className="mt-2 text-sm text-gray-500">
                        {repair.description}
                      </p>
                    )}
                  </div>

                  <Link href={`/assets/${repair.asset_id}`}>
                    <Button variant="outline">
                      View Equipment
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
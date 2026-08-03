"use client";

import Link from "next/link";

export type UpcomingMaintenanceRecord = {
  id: string;
  asset_id: string;
  issue_title: string;
  next_service_date: string | null;
  assets?: {
    display_name: string | null;
    asset_tag: string | null;
  } | null;
};

type Props = {
  records: UpcomingMaintenanceRecord[];
};

export default function UpcomingMaintenance({
  records,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Upcoming Maintenance
        </h2>

        <Link
          href="/maintenance"
          className="text-sm text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="mt-6 text-gray-500">
          No scheduled maintenance.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border p-4"
            >
              <div className="font-semibold">
                {record.assets?.display_name ??
                  record.assets?.asset_tag ??
                  "Equipment"}
              </div>

              <div className="text-sm text-gray-500">
                {record.issue_title}
              </div>

              <div className="mt-2 text-sm font-medium text-orange-600">
                {record.next_service_date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
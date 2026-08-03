"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export type TransferRecord = {
  id: string;
  asset_id: string;
  checked_out_by: string;
  department: string | null;
  purpose: string | null;
  checked_out_date: string;
  due_date: string;
  returned_date: string | null;
  notes: string | null;
  created_at: string;
  assets:
    | {
        id: string;
        asset_tag: string | null;
        display_name: string | null;
        status: string | null;
      }
    | {
        id: string;
        asset_tag: string | null;
        display_name: string | null;
        status: string | null;
      }[]
    | null;
};

type TransfersTableProps = {
  transfers: TransferRecord[];
  returningTransferId: string | null;
  onReturn: (transfer: TransferRecord) => void;
};

function getEquipment(transfer: TransferRecord) {
  if (Array.isArray(transfer.assets)) {
    return transfer.assets[0] ?? null;
  }

  return transfer.assets;
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US");
}

function getTransferStatus(transfer: TransferRecord) {
  if (transfer.returned_date) {
    return "Returned";
  }

  const today = new Date().toISOString().split("T")[0];

  if (transfer.due_date < today) {
    return "Overdue";
  }

  if (transfer.due_date === today) {
    return "Due Today";
  }

  return "Active";
}

function statusClasses(status: string) {
  if (status === "Returned") {
    return "bg-gray-100 text-gray-700";
  }

  if (status === "Overdue") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Due Today") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-green-100 text-green-700";
}

export default function TransfersTable({
  transfers,
  returningTransferId,
  onReturn,
}: TransfersTableProps) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h3 className="text-xl font-semibold">
          No transfers found
        </h3>

        <p className="mt-2 text-gray-500">
          Transfer an equipment item or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[1100px]">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Equipment</th>
            <th className="p-4 text-left">Transferred To</th>
            <th className="p-4 text-left">Department</th>
            <th className="p-4 text-left">Purpose</th>
            <th className="p-4 text-left">Transferred</th>
            <th className="p-4 text-left">Due</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {transfers.map((transfer) => {
            const equipment = getEquipment(transfer);
            const transferStatus = getTransferStatus(transfer);
            const equipmentName =
              equipment?.display_name ||
              equipment?.asset_tag ||
              "Unnamed Equipment";

            return (
              <tr
                key={transfer.id}
                className="border-t align-top hover:bg-gray-50"
              >
                <td className="p-4">
                  <Link
                    href={`/assets/${transfer.asset_id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {equipmentName}
                  </Link>

                  {equipment?.asset_tag && (
                    <p className="mt-1 text-sm text-gray-500">
                      {equipment.asset_tag}
                    </p>
                  )}
                </td>

                <td className="p-4 font-medium">
                  {transfer.checked_out_by}
                </td>

                <td className="p-4">
                  {transfer.department || "—"}
                </td>

                <td className="p-4">
                  <p>{transfer.purpose || "—"}</p>

                  {transfer.notes && (
                    <p className="mt-1 max-w-xs text-sm text-gray-500">
                      {transfer.notes}
                    </p>
                  )}
                </td>

                <td className="p-4">
                  {formatDate(transfer.checked_out_date)}
                </td>

                <td className="p-4 font-medium">
                  {formatDate(transfer.due_date)}
                </td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses(
                      transferStatus
                    )}`}
                  >
                    {transferStatus}
                  </span>

                  {transfer.returned_date && (
                    <p className="mt-2 text-xs text-gray-500">
                      Returned {formatDate(transfer.returned_date)}
                    </p>
                  )}
                </td>

                <td className="p-4">
                  {!transfer.returned_date ? (
                    <Button
                      variant="outline"
                      onClick={() => onReturn(transfer)}
                      disabled={
                        returningTransferId === transfer.id
                      }
                    >
                      {returningTransferId === transfer.id
                        ? "Returning..."
                        : "Return Equipment"}
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Complete
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
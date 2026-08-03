import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  formatMaintenanceCurrency,
  formatMaintenanceDate,
  getEquipment,
  maintenancePriorityClasses,
  maintenanceStatusClasses,
  type MaintenanceRecord,
} from "./types";

type MaintenanceCardProps = {
  record: MaintenanceRecord;
  showEquipment?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (record: MaintenanceRecord) => void;
};

export default function MaintenanceCard({
  record,
  showEquipment = false,
  onEdit,
  onDelete,
}: MaintenanceCardProps) {
  const equipment = getEquipment(record);

  const equipmentName =
    equipment?.display_name ||
    equipment?.asset_tag ||
    "Unnamed Equipment";

  return (
    <article className="rounded-xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${maintenanceStatusClasses(
                record.status
              )}`}
            >
              {record.status}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${maintenancePriorityClasses(
                record.priority
              )}`}
            >
              {record.priority} Priority
            </span>
          </div>

          <h3 className="mt-4 text-xl font-bold">
            {record.issue_title}
          </h3>

          {showEquipment && (
            <p className="mt-1 font-medium text-gray-700">
              {equipmentName}
            </p>
          )}

          {record.description && (
            <p className="mt-4 text-gray-700">
              {record.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {showEquipment && (
            <Link href={`/assets/${record.asset_id}`}>
              <Button variant="outline">View Equipment</Button>
            </Link>
          )}

          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(record)}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(record)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t pt-5 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-sm text-gray-500">Technician</p>
          <p className="mt-1 font-semibold">
            {record.technician || "Unassigned"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Repair Cost</p>
          <p className="mt-1 font-semibold">
            {formatMaintenanceCurrency(record.repair_cost)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Opened</p>
          <p className="mt-1 font-semibold">
            {formatMaintenanceDate(record.opened_date)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-1 font-semibold">
            {formatMaintenanceDate(record.completed_date)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Next Service</p>
          <p className="mt-1 font-semibold">
            {formatMaintenanceDate(record.next_service_date)}
          </p>
        </div>
      </div>

      {showEquipment && equipment?.location && (
        <p className="mt-4 text-sm text-gray-500">
          Location: {equipment.location}
        </p>
      )}

      {record.resolution_notes && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">
            Resolution
          </p>
          <p className="mt-2 text-gray-700">
            {record.resolution_notes}
          </p>
        </div>
      )}
    </article>
  );
}
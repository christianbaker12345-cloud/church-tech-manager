export type MaintenanceStatus =
  | "Open"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type MaintenancePriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

export type EquipmentSummary = {
  id: string;
  asset_tag: string | null;
  display_name: string | null;
  status: string | null;
  location: string | null;
};

export type MaintenanceRecord = {
  id: string;
  asset_id: string;
  issue_title: string;
  description: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  technician: string | null;
  repair_cost: number | null;
  opened_date: string;
  completed_date: string | null;
  next_service_date: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  assets?: EquipmentSummary | EquipmentSummary[] | null;
};

export const maintenanceStatusOptions: MaintenanceStatus[] = [
  "Open",
  "In Progress",
  "Completed",
  "Cancelled",
];

export const maintenancePriorityOptions: MaintenancePriority[] = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

export function getEquipment(
  record: MaintenanceRecord
): EquipmentSummary | null {
  if (Array.isArray(record.assets)) {
    return record.assets[0] ?? null;
  }

  return record.assets ?? null;
}

export function formatMaintenanceDate(date: string | null) {
  if (!date) return "—";

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const parsedDate = dateOnlyPattern.test(date)
    ? new Date(`${date}T00:00:00`)
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US");
}

export function formatMaintenanceCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function maintenanceStatusClasses(status: MaintenanceStatus) {
  if (status === "Completed") {
    return "bg-green-100 text-green-700";
  }

  if (status === "In Progress") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "Cancelled") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-red-100 text-red-700";
}

export function maintenancePriorityClasses(
  priority: MaintenancePriority
) {
  if (priority === "Urgent") {
    return "bg-red-100 text-red-700";
  }

  if (priority === "High") {
    return "bg-orange-100 text-orange-700";
  }

  if (priority === "Low") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
}